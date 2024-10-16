export default function MainContent() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-12 px-4 py-8 md:px-12">
      <div className="mx-auto w-[600px]">
        <h1 className="text-center text-2xl font-bold text-zinc-300">
          Com o <span className="text-3xl text-zinc-50">Resumer</span>, você
          obtém resumos inteligentes e rápidos das matérias que desejar, usando
          o poder da Inteligência Artificial.
        </h1>
      </div>
      <div className="flex flex-col gap-12">
        <div className="mx-auto flex w-[600px] items-center justify-between gap-2 rounded-xl border border-zinc-500 px-6 py-3">
          <input
            type="text"
            placeholder="Cole a URL"
            className="w-[500px] rounded-md bg-zinc-800 px-4 py-3 font-semibold outline-0"
          />
          <button className="rounded-md bg-zinc-200 px-4 py-3 text-lg font-semibold text-zinc-950 transition-colors hover:bg-zinc-300">
            Resumer
          </button>
        </div>
        <div>
          <div className="h-[400px] w-[600px] rounded-md bg-zinc-800 px-4 py-3 font-semibold outline-0">
            <p className="text-lg text-zinc-300">
              {" "}
              Resumo gerado com o Resumer, um AI que gera resumos de matérias de
              jornalísticas a partir de URLs. Simplifique sua leitura com
              resumos rápidos, precisos e fáceis de entender.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
