/* eslint-disable @typescript-eslint/no-empty-object-type */
interface ButtonProps extends React.ComponentProps<"button"> {}

export default function ButtonResumer({ ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type="submit"
      className="w-full rounded-md bg-zinc-200 px-4 py-3 text-lg font-semibold text-zinc-950 transition-colors hover:bg-zinc-300 sm:w-auto"
    >
      Resumer
    </button>
  );
}
