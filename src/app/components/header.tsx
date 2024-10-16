import { IconBrandGithub, IconBrandLinkedin, IconBrandX, IconFileBroken } from "@tabler/icons-react";

export default function Header() {
  return (
    <header className="bg-[#2b2d38] shadow-lg">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-8 md:px-12">
        <h1 className="flex items-center gap-1 text-4xl font-bold text-zinc-50">
          <IconFileBroken size={36} stroke={1.5} />
          Resumer
        </h1>
        <div className="text-lg text-white flex items-center gap-2">
          <IconBrandGithub stroke={1}/>
          <IconBrandX stroke={1} />
          <IconBrandLinkedin stroke={1} />
        </div>
      </div>
    </header>
  );
}
