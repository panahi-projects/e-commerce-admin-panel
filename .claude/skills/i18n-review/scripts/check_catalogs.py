#!/usr/bin/env python3
"""
check_catalogs.py — compare i18n message catalogs across locales and report
coverage gaps: missing keys, extra keys, empty values, value==key, and
value-identical-to-default (possible untranslated). Works with flat or nested
JSON catalogs, and with i18next-style namespaced directories.

Usage:
  # Explicit files (first = reference/default locale):
  python3 check_catalogs.py en.json fa.json [de.json ...]

  # A directory of <locale>.json (e.g. messages/):
  python3 check_catalogs.py --dir messages --default en

  # i18next layout public/locales/<lng>/<ns>.json (merges namespaces per locale):
  python3 check_catalogs.py --i18next public/locales --default en

Exit code is 0 always; this is a report, not a gate (wrap in CI if desired).
"""
import argparse, json, os, sys, glob

def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def flatten(obj, prefix=""):
    """Flatten nested dict into dotted keys -> str value."""
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.update(flatten(v, f"{prefix}.{k}" if prefix else k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out.update(flatten(v, f"{prefix}[{i}]"))
    else:
        out[prefix] = obj
    return out

def load_locale_files(files):
    """Return {locale: flat_dict} from a list of <locale>.json files."""
    data = {}
    for fp in files:
        loc = os.path.splitext(os.path.basename(fp))[0]
        data[loc] = flatten(load(fp))
    return data

def load_dir(d):
    files = sorted(glob.glob(os.path.join(d, "*.json")))
    if not files:
        sys.exit(f"No *.json catalogs in {d}")
    return load_locale_files(files)

def load_i18next(root):
    """public/locales/<lng>/<ns>.json -> merge namespaces per locale (ns-prefixed keys)."""
    data = {}
    for lng_dir in sorted(glob.glob(os.path.join(root, "*"))):
        if not os.path.isdir(lng_dir):
            continue
        loc = os.path.basename(lng_dir)
        merged = {}
        for nsfile in sorted(glob.glob(os.path.join(lng_dir, "*.json"))):
            ns = os.path.splitext(os.path.basename(nsfile))[0]
            flat = flatten(load(nsfile))
            for k, v in flat.items():
                merged[f"{ns}:{k}"] = v
        data[loc] = merged
    if not data:
        sys.exit(f"No <locale>/<ns>.json catalogs under {root}")
    return data

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*", help="<locale>.json files, first is default")
    ap.add_argument("--dir", help="directory of <locale>.json")
    ap.add_argument("--i18next", help="root of public/locales/<lng>/<ns>.json")
    ap.add_argument("--default", help="default/reference locale code")
    args = ap.parse_args()

    if args.i18next:
        data = load_i18next(args.i18next)
    elif args.dir:
        data = load_dir(args.dir)
    elif args.files:
        data = load_locale_files(args.files)
    else:
        ap.error("provide files, --dir, or --i18next")

    locales = list(data.keys())
    if args.default and args.default in data:
        ref = args.default
    elif args.files:
        ref = os.path.splitext(os.path.basename(args.files[0]))[0]
    else:
        ref = "en" if "en" in data else locales[0]

    ref_keys = set(data[ref].keys())
    print(f"Reference locale: {ref}  ({len(ref_keys)} keys)")
    print(f"Locales: {', '.join(locales)}")
    print("=" * 60)

    for loc in locales:
        if loc == ref:
            continue
        keys = set(data[loc].keys())
        missing = sorted(ref_keys - keys)         # in ref, not here -> untranslated
        extra   = sorted(keys - ref_keys)          # here, not in ref -> stale/orphan
        empty   = sorted(k for k in keys if isinstance(data[loc][k], str) and data[loc][k].strip() == "")
        keyeq   = sorted(k for k in keys if isinstance(data[loc][k], str) and data[loc][k].strip() == k.split(".")[-1])
        same    = sorted(k for k in (keys & ref_keys)
                         if isinstance(data[loc][k], str) and isinstance(data[ref][k], str)
                         and data[loc][k].strip() != "" and data[loc][k] == data[ref][k])
        covered = len(ref_keys) - len(missing)
        pct = (covered / len(ref_keys) * 100) if ref_keys else 100.0

        print(f"\n[{loc}]  coverage {pct:.1f}%  ({covered}/{len(ref_keys)})")
        def show(label, items, n=25):
            if items:
                print(f"  {label}: {len(items)}")
                for k in items[:n]:
                    print(f"      - {k}")
                if len(items) > n:
                    print(f"      ... +{len(items)-n} more")
        show("MISSING (in {} not {})".format(ref, loc), missing)
        show("EXTRA (in {} not {})".format(loc, ref), extra)
        show("EMPTY values", empty)
        show("VALUE == key (placeholder?)", keyeq)
        show("SAME AS DEFAULT (review: maybe untranslated)", same)

    print("\n" + "=" * 60)
    print("Note: 'same as default' and 'value==key' are heuristics — some are")
    print("legitimate (cognates, brand names). Verify before treating as defects.")

if __name__ == "__main__":
    main()
