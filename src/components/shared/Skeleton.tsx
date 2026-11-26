interface SkeletonProps {
  className?: string;
}

/** Shimmer skeleton block. Pass className for width/height. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton card for NFT grid */
export function NFTCardSkeleton() {
  return (
    <div className="nft-card" aria-hidden="true">
      <div className="nft-image-wrap">
        <Skeleton className="w-full h-full absolute inset-0" />
      </div>
      <div className="nft-info">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
