const blurLayers = Array.from({ length: 7 }, (_, index) => index + 1);

export default function ProgressiveBlurFade() {
  return (
    <div className="progressive-blur-fade" aria-hidden="true">
      {blurLayers.map((layer) => (
        <div key={layer} className={`progressive-blur-fade__layer progressive-blur-fade__layer--${layer}`} />
      ))}
      <div className="progressive-blur-fade__tint" />
    </div>
  );
}
