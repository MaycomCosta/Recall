import type { ButtonHTMLAttributes, ReactNode } from "react";
export function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`button ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function BookMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 24 : 32}
      height={small ? 24 : 32}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 5h10v23L6 24V5Zm10 0h10v19l-10 4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 10h3m-3 5h3m7-5h3m-3 5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="error">
      {children}
    </p>
  );
}
