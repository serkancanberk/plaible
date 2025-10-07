import React from 'react';

export interface HowToPlayCardProps {
  image: string;
  title: string;
  description: string;
  step: string;
  className?: string;
}

export const HowToPlayCard: React.FC<HowToPlayCardProps> = ({ image, title, description, step, className }) => {
  return (
    <div
      className={[
        'block bg-primary text-text-tertiary rounded-card shadow-card overflow-hidden',
        'border border-transparent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
        'flex flex-col justify-between h-full',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Media section with inner padding */}
      <div className="px-spacing-md pt-spacing-md">
        <div className="rounded-xl overflow-hidden bg-surface-muted aspect-[16/9] bg-dark_mode_highlight">
          <img
            src={image}
            alt={title}
            className="object-contain w-full h-full p-spacing-xs"
            loading="lazy"
          />
        </div>
      </div>

      {/* Content section */}
      <div className="flex-grow flex flex-col justify-between px-spacing-md pt-spacing-md">
        <div className="flex flex-col gap-spacing-2xs">
          <h3 className="font-serif text-subheading text-accent">{title}</h3>
          <p className="font-sans text-body text-text-tertiary mt-spacing-xs">{description}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mt-spacing-lg px-spacing-md pb-spacing-md">
        <div className="bg-primary border border-accent font-serif text-body text-accent rounded-lg mt-spacing-lg text-center py-2">
          {step}
        </div>
      </div>
    </div>
  );
};

export default HowToPlayCard;
