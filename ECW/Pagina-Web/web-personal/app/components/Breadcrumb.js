import Link from "next/link";
import styles from "./Breadcrumb.module.css";

// items: [{ label, href }, ...]. El último es la página actual (sin enlace).
export default function Breadcrumb({ items }) {
  const lastIndex = items.length - 1;

  return (
    <nav className={styles.breadcrumb} aria-label="Migas de pan">
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === lastIndex;

          return (
            <li className={styles.item} key={item.href ?? item.label}>
              {index > 0 && (
                <span className={styles.separator} aria-hidden="true">
                  ›
                </span>
              )}

              {isLast ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
