import { Button } from "@/components/ui/button";

/* eslint-disable @typescript-eslint/no-empty-object-type */
interface ButtonProps extends React.ComponentProps<"button"> {}

export default function ButtonResumer({ ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      type="submit"
      className="bg-gradient-custom w-full text-xl sm:w-auto"
      size="lg"
    >
      Resumer
    </Button>
  );
}
