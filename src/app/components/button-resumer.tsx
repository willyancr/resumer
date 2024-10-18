import { Button } from "@/components/ui/button";

interface ButtonProps extends React.ComponentProps<"button"> {
  disabled?: boolean;
}

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
