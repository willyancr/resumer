interface RedirectProps extends React.HTMLProps<HTMLAnchorElement> {
  children: React.ReactNode;
}

export default function RedirectMidiaSocial({
  children,
  ...props
}: RedirectProps) {
  return (
    <a target="_blank" className="transition-all hover:scale-110" {...props}>
      {children}
    </a>
  );
}
