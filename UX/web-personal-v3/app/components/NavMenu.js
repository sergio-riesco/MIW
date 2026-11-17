"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectionOf } from "../i18n/config";
import styles from "./SiteShell.module.css";

// Menú principal. Marca la sección en la que está el usuario con
// aria-current (lo leen los lectores de pantalla) y con estilo propio.
// v3: cada enlace lleva el color de su sección (--item).
export default function NavMenu({ lang, label, items }) {
  const current = sectionOf(usePathname(), lang);

  return (
    <nav aria-label={label}>
      <ul className={styles.navList}>
        {items.map((item) => {
          const active = item.key === current;

          return (
            <li key={item.key}>
              <Link
                className={styles.navLink}
                style={{ "--item": `var(--sec-${item.key})` }}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
