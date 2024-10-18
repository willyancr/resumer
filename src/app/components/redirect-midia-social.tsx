interface RedirectProps extends React.HTMLProps<HTMLAnchorElement> {
  children: React.ReactNode;
}

export default function RedirectMidiaSocial({
  children,
  ...props
}: RedirectProps) {
  return (
    <a target="_blank" className="transition hover:text-yellow-900" {...props}>
      {children}
    </a>
  );
}
