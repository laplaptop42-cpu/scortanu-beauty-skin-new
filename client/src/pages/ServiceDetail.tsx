import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Tag } from "lucide-react";

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading } = trpc.services.getBySlug.useQuery(slug || "");

  if (isLoading) {
    return (
      <div className="py-16">
        <div className="container max-w-4xl">
          <div className="h-96 rounded-xl bg-muted animate-pulse mb-8" />
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-16 text-center">
        <div className="container">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <Button asChild><Link href="/services">Back to Services</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-4xl">
        <Link href="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-xl overflow-hidden">
            <img src={service.imageUrl || ""} alt={service.name} className="w-full h-full object-cover" />
          </div>

          <div>
            {service.category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
                <Tag className="h-3 w-3" /> {service.category}
              </span>
            )}
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">{service.name}</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {service.longDescription || service.description}
            </p>

            <div className="flex items-center gap-6 mb-6 pb-6 border-b">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-primary">CHF {Number(service.price).toFixed(0)}</p>
              </div>
              {service.duration && (
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="flex items-center gap-1 text-lg font-semibold">
                    <Clock className="h-4 w-4 text-muted-foreground" /> {service.duration} min
                  </p>
                </div>
              )}
            </div>

            <Button size="lg" asChild className="w-full">
              <Link href={`/book/${service.id}`}>Book This Service</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
