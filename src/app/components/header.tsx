import {
  IconBrandGithub,
  IconDeviceImac,
  IconFileBroken,
} from "@tabler/icons-react";
import RedirectMidiaSocial from "./redirect-midia-social";

export default function Header() {
  return (
    <header className="bg-gradient shadow-lg">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-8 md:px-12">
        <h1 className="bg-gradient-custom flex items-center gap-1 bg-clip-text text-4xl font-bold text-transparent">
          <IconFileBroken size={36} stroke={1} className="text-primary" />
          Resumer
        </h1>
        <div className="flex items-center gap-2 text-lg text-primary">
          <RedirectMidiaSocial href="https://github.com/willyancr">
            <IconBrandGithub stroke={1} />
          </RedirectMidiaSocial>
          <RedirectMidiaSocial href="https://meuportfolio-wcr.vercel.app/">
            <IconDeviceImac stroke={1} />
          </RedirectMidiaSocial>
        </div>
      </div>
    </header>
  );
}
