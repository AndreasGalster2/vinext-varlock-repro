import { ENV } from "varlock/env";

export default function Page() {
  return (
    <main>
      <h1>vinext + varlock repro</h1>
      <p>public: {ENV.REPRO_PUBLIC_VALUE ?? "(missing)"}</p>
      <p>secret present: {ENV.REPRO_SECRET_VALUE ? "yes" : "no"}</p>
    </main>
  );
}
