import Link from "next/link";
import type { ReactNode } from "react";

type WrapperProps = {
  authorID: string | null | undefined;
  className?: string;
  children: ReactNode;
};

export function Wrapper({
  authorID,
  className,
  children,
}: WrapperProps) {
  if (authorID) {
    return (
      <Link href={`/users/${authorID}`} className={className}>
        {children}
      </Link>
    );
  }

  return <div className={className}>{children}</div>;
}