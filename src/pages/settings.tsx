import DefaultFormat from "@/components/settings/default-format";
import QualityPicker from "@/components/settings/quality";

export default function Settings() {
    return (
        <section className="section py-8">
            <div className="mb-6">
                <h2 className="text-2xl font-body font-semibold text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure your conversion preferences.
                </p>
            </div>
            <div className="flex flex-col gap-y-6">
                <QualityPicker />
                <DefaultFormat />
            </div>
        </section>
    )
}
