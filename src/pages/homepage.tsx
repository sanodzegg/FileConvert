import Dropbox from "@/components/files/dropbox";
import FileList from "@/components/files/list";
import ConvertedFiles from "@/components/files/converted";

export default function Homepage() {

  return (
    <section className="section py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-body font-semibold text-foreground">Convert almost anything, instantly.</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Images, videos, documents — drag in a file and get it back in the format you need.
        </p>
      </div>
      <Dropbox />
      <FileList />
      <ConvertedFiles />
    </section>
  )
}
