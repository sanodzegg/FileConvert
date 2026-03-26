import { Check } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number'
import { cn } from '@/lib/utils'

type Interval = 'monthly' | 'annual'

export interface PricingCardProps {
    icon: LucideIcon
    title: string
    description: string
    price: number | { monthly: number; annual: number }
    priceSuffix?: string
    features: string[]
    ctaLabel: string
    ctaVariant?: 'default' | 'outline'
    interval?: Interval
    onIntervalChange?: (interval: Interval) => void
}

export function PricingCard({
    icon: Icon,
    title,
    description,
    price,
    priceSuffix,
    features,
    ctaLabel,
    ctaVariant = 'default',
    interval,
    onIntervalChange,
}: PricingCardProps) {
    const displayPrice = typeof price === 'object'
        ? (interval === 'monthly' ? price.monthly : price.annual)
        : price

    return (
        <Card className="relative overflow-hidden border-border backdrop-blur-xl bg-muted/50 dark:bg-black/30 dark:border-white/20">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-foreground/10 to-transparent" />

            <CardHeader className="relative gap-4">
                <div className="size-14 rounded-2xl flex items-center justify-center shrink-0 bg-foreground/10 border border-foreground/15">
                    <Icon className="size-6 text-foreground/70" />
                </div>

                <div>
                    <CardTitle className="text-xl mb-2 font-body font-medium">{title}</CardTitle>
                    <div className="flex items-center gap-1.5">
                        {displayPrice === 0 ? (
                            <span className="text-4xl font-medium text-foreground leading-none">FREE</span>
                        ) : typeof price === 'object' ? (
                            <>
                                <span className="text-xl text-muted-foreground">$</span>
                                <CountingNumber
                                    number={displayPrice}
                                    decimalPlaces={2}
                                    initiallyStable
                                    inView
                                    transition={{ stiffness: 300, damping: 60 }}
                                    className="text-4xl font-medium text-foreground leading-none tabular-nums"
                                />
                                {priceSuffix && (
                                    <span className="text-sm text-muted-foreground mt-auto mb-1 ml-0.5">{priceSuffix}</span>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="text-xl text-muted-foreground">$</span>
                                <span className="text-4xl font-medium text-foreground leading-none">{displayPrice}</span>
                                {priceSuffix && (
                                    <span className="text-sm text-muted-foreground mt-auto mb-1 ml-0.5">{priceSuffix}</span>
                                )}
                            </>
                        )}
                    </div>

                    {interval && onIntervalChange ? (
                        <div className="flex items-center gap-1.5 mt-2">
                            {(['monthly', 'annual'] as Interval[]).map(i => (
                                <button
                                    key={i}
                                    onClick={() => onIntervalChange(i)}
                                    className={cn(
                                        'text-xs px-3 py-1 rounded-full border transition-colors capitalize',
                                        interval === i
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border text-muted-foreground hover:border-primary/50'
                                    )}
                                >
                                    {i}
                                </button>
                            ))}
                            {interval === 'annual' && (
                                <span className="text-xs text-primary">Save 20%</span>
                            )}
                        </div>
                    ) : (
                        <CardDescription className="mt-1">{description}</CardDescription>
                    )}
                </div>
            </CardHeader>

            <CardContent className="relative">
                <ul className="flex flex-col gap-3">
                    {features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <Check className="size-4 text-foreground/70 shrink-0 mt-0.5" />
                            {f}
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="relative">
                <Button variant={ctaVariant} className="w-full">{ctaLabel}</Button>
            </CardFooter>
        </Card>
    )
}
