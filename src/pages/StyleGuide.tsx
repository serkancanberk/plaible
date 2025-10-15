import PlaibleLogo from '../components/PlaibleLogo';
import C2AButton from '../components/C2AButton';
import ColorCard from '../components/ColorCard';
import WhatPeoplePlayingCardPreview from '../styleguide/WhatPeoplePlayingCardPreview';
import WhatPeopleSayingCardPreview from '../styleguide/WhatPeopleSayingCardPreview';
import MenuItemPreview from '../styleguide/MenuItemPreview';
import ModalVariantsPreview from '../styleguide/ModalVariantsPreview';
import C2AButtonsPreview from '../styleguide/C2AButtonsPreview';
import C2AButtonGroupPreview from '../styleguide/C2AButtonGroupPreview';
import { UI_BG_TOKENS } from './tokens';
import TextLink from '../components/ui/TextLink';
import React from 'react';
import CheckLegalStuffModal from '../components/ui/modals/CheckLegalStuffModal';
import KeepInTouchModal from '../components/ui/modals/KeepInTouchModal';
import PayAsYouGoModal from '../components/ui/modals/PayAsYouGoModal';
import { Dropdown } from '../components/ui/Dropdown';
import { Input } from '../components/ui/Input';

// Strict token lists (only configured/used tokens)
const textTokenStyles = {
  'text-hero': 'text-hero font-sans text-text-tertiary',
  'text-heading': 'text-heading font-sans text-text-tertiary',
  'text-subheading': 'text-subheading font-sans text-text-tertiary',
  'text-body': 'text-body font-sans text-text-tertiary',
  'text-label': 'text-label font-sans text-text-tertiary',
  'text-caption': 'text-caption font-sans text-text-tertiary',
};

// Parallel mono-style text tokens using Geist Mono with existing sizes
const monoTextTokenStyles = {
  'mono-hero': 'text-hero font-mono text-text-tertiary',
  'mono-heading': 'text-heading font-mono text-text-tertiary',
  'mono-subheading': 'text-subheading font-mono text-text-tertiary',
  'mono-body': 'text-body font-mono text-text-tertiary',
  'mono-label': 'text-label font-mono text-text-tertiary',
  'mono-caption': 'text-caption font-mono text-text-tertiary',
};

// Parallel serif-style text tokens using Cormorant Garamond with existing sizes
const serifTextTokenStyles = {
  'serif-hero': 'text-hero font-serif text-text-tertiary',
  'serif-heading': 'text-heading font-serif text-text-tertiary',
  'serif-subheading': 'text-subheading font-serif text-text-tertiary',
  'serif-body': 'text-body font-serif text-text-tertiary',
  'serif-label': 'text-label font-serif text-text-tertiary',
  'serif-caption': 'text-caption font-serif text-text-tertiary',
};

const textColors = [
  { token: 'text-text-primary', label: 'Primary', hex: '#192233' },
  { token: 'text-text-secondary', label: 'Secondary', hex: '#6E7794' },
  { token: 'text-text-tertiary', label: 'Tertiary', hex: '#F4F0EC' },
  { token: 'text-accent', label: 'Accent', hex: '#FFCC00' },
  { token: 'text-success', label: 'Success', hex: '#D3FF34' },
  { token: 'text-alert', label: 'Alert', hex: '#D23001' },
  { token: 'text-dark_mode_highlight', label: 'dark_mode_highlight', hex: '#F4F0EC' },
];

const bgColors = [
  { token: 'bg-primary', label: 'Primary', hex: '#192233' },
  { token: 'bg-secondary', label: 'Secondary', hex: '#141416' },
  { token: 'bg-accent', label: 'Accent', hex: '#FFCC00' },
];

export default function StyleGuide() {
  return (
    <div className={`min-h-screen w-full max-w-5xl mx-auto p-8 space-y-10 ${UI_BG_TOKENS.muted}`}>
              <h2 className="text-hero text-accent mb-4">Text Styles</h2>
      <section id="text-styles" className="space-y-3">
        <div className="text-subheading text-text-secondary">Geist Sans Text Styles</div>
        <div className="space-y-2">
          {Object.entries(textTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
          ))}
        </div>
      </section>

      <section id="mono-text-styles" className="space-y-3">
        <div className="text-subheading text-text-secondary">Geist Mono Text Styles</div>
        <div className="space-y-2">
          {Object.entries(monoTextTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
          ))}
        </div>
      </section>

      <section id="serif-text-styles" className="space-y-3">
        <div className="text-subheading text-text-secondary">Cormorant Garamond Text Styles</div>
        <div className="space-y-2">
          {Object.entries(serifTextTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
          ))}
        </div>
      </section>

      <section id="color-styles" className="space-y-3 mt-10">
        <h2 className="text-heading text-text-secondary mb-4">Text Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {textColors.map((color) => (
            <ColorCard key={color.token} {...color} />
          ))}
        </div>
      </section>

      <h2 className="text-hero text-accent mb-4">Color Styles</h2>

      <section id="other-styles" className="space-y-3 mt-10">
        <h2 className="text-heading text-text-secondary mb-4">Background Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {bgColors.map((color) => (
            <ColorCard key={color.token} {...color} />
          ))}
        </div>
      </section>

      <h2 className="text-hero text-accent mb-4">Logo Variants</h2>
      <section id="components" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Plaible Logo Variants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center"><PlaibleLogo variant="original" size="sm" /></div>
          <div className="flex items-center"><PlaibleLogo variant="light" size="sm" /></div>
          <div className="flex items-center"><PlaibleLogo variant="ai-original" size="sm" /></div>
          <div className="flex items-center"><PlaibleLogo variant="ai-light" size="sm" /></div>
        </div>
      </section>

      
      <section className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Plaible Logo Sizes (sm / md / lg)</h2>
        <div className="flex flex-col gap-4">
          <PlaibleLogo size="sm" />
          <PlaibleLogo size="md" />
          <PlaibleLogo size="lg" accent />
        </div>
      </section>

      <h2 className="text-hero text-accent mb-4">Components</h2>

      <section id="cta-buttons" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">CTA Buttons</h2>
        <C2AButtonsPreview />
      </section>

      {/* Visual token-only previews for accent background context. */}
      <section id="cta-on-accent" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Contextual: onAccent (accent BG)</h2>
        {/* Note: These are visual, token-only previews. Actual variant support may be added later. */}
        <div className="bg-accent p-spacing-md rounded-xl space-y-spacing-md">
          {/* Primary on Accent */}
          <div className="space-y-spacing-xs">
            <p className="text-label">Primary on Accent</p>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-spacing-sm rounded-card py-spacing-md px-spacing-lg font-semibold text-body bg-primary text-text-tertiary transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
            >
              Primary on Accent
            </button>
          </div>

          {/* Secondary on Accent */}
          <div className="space-y-spacing-xs">
            <p className="text-label">Secondary on Accent</p>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-spacing-sm rounded-card py-spacing-md px-spacing-lg font-semibold text-caption bg-text-tertiary text-text-primary transition-colors duration-200 hover:bg-text-tertiary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-tertiary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
            >
              Secondary on Accent
            </button>
          </div>

          {/* Ghost on Accent */}
          <div className="space-y-spacing-xs">
            <p className="text-label">Ghost on Accent</p>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-spacing-sm rounded-card py-spacing-md px-spacing-lg font-semibold text-caption bg-transparent text-text-primary border border-text-primary transition-colors duration-200 hover:bg-text-tertiary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
            >
              Ghost on Accent
            </button>
          </div>

          {/* Disabled example */}
          <div className="space-y-spacing-xs">
            <p className="text-label">Disabled (Secondary on Accent)</p>
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-spacing-sm rounded-card py-spacing-md px-spacing-lg font-semibold text-caption bg-text-tertiary text-text-primary transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Disabled on Accent
            </button>
          </div>
        </div>
      </section>

      {/* Prop-based previews using C2AButton context="onAccent" */}
      <section id="cta-on-accent-prop" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Contextual: onAccent (via C2AButton prop)</h2>
        <div className="bg-accent p-spacing-md rounded-xl space-y-spacing-md">
          <div className="flex flex-wrap items-center gap-spacing-md">
            <C2AButton context="onAccent" variant="primary">Primary on Accent</C2AButton>
            <C2AButton context="onAccent" variant="secondary" typography="caption">Secondary on Accent</C2AButton>
            <C2AButton context="onAccent" variant="ghost" typography="caption">Ghost on Accent</C2AButton>
            <C2AButton context="onAccent" variant="secondary" disabled typography="caption">Disabled on Accent</C2AButton>
          </div>
        </div>
      </section>

      <section id="cta-button-groups" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">CTA Button Groups</h2>
        <C2AButtonGroupPreview />
      </section>

      {/* Landing Tabs (Tokenized) */}
      <section id="landing-tabs-tokenized" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Landing Tabs (Tokenized)</h2>
        <LandingTabsPreview />
      </section>

      {/* TextLink preview */}
      <section id="text-link-mono-accent" className="mt-10">
        <h2 className="text-heading text-text-secondary mb-4">TextLink (mono-accent)</h2>
        <p className="text-body text-text-secondary mb-spacing-sm">
          This is a sample usage of the mono-accent text link:
        </p>
        <div className="space-y-spacing-sm">
          <div>
            <p className="text-label text-text-secondary mb-spacing-xs">Default</p>
            <TextLink href="#">Explore the full character archive</TextLink>
          </div>
          <div>
            <p className="text-label text-text-secondary mb-spacing-xs">With iconRight</p>
            <TextLink href="#" iconRight={<span>→</span>}>Explore the full character archive</TextLink>
          </div>
          <div>
            <p className="text-label text-text-secondary mb-spacing-xs">With iconLeft</p>
            <TextLink href="#" iconLeft={<span>←</span>}>Explore the full character archive</TextLink>
          </div>
          <div>
            <p className="text-label text-text-secondary mb-spacing-xs">context="onDark"</p>
            <div className="bg-secondary p-spacing-md rounded-card">
              <TextLink href="#" context="onDark" iconRight={<span>→</span>}>Explore the full character archive</TextLink>
            </div>
          </div>
          <div>
            <p className="text-label text-text-secondary mb-spacing-xs">muted</p>
            <TextLink href="#" muted>Explore the full character archive</TextLink>
          </div>
          <div>
            <p className="text-label text-text-secondary mb-spacing-xs">selected</p>
            <TextLink href="#" selected iconRight={<span>→</span>}>Explore the full character archive</TextLink>
          </div>
        </div>
      </section>

      <section id="what-people-playing-card" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">What People Are Playing Card</h2>
        <WhatPeoplePlayingCardPreview />
      </section>

      <section id="what-people-saying-card" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">What People Are Saying Card</h2>
        <WhatPeopleSayingCardPreview />
      </section>

      <section id="navigation-menu-item" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Navigation Menu Item</h2>
        <MenuItemPreview />
      </section>

      <section id="modals" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Modals</h2>
        <ModalVariantsPreview extraTriggers={<ExtraModalTriggers />} />
      </section>

      <section id="dropdown-variants" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Dropdown Variants</h2>
        <DropdownVariantsPreview />
      </section>

      <section id="input-variants" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Input Variants</h2>
        <InputVariantsPreview />
      </section>

    </div>
  );
}

function LandingTabsPreview() {
  const [active, setActive] = React.useState('one');
  return (
    <div className="bg-secondary p-spacing-md rounded-card">
      <div role="tablist" aria-label="Landing tabs preview" className="flex gap-4 border-b border-text-secondary/30">
        <button
          type="button"
          role="tab"
          aria-selected={active === 'one'}
          aria-controls="panel-one"
          id="tab-one"
          onClick={() => setActive('one')}
          className={`tab-base ${active === 'one' ? 'tab-active' : 'tab-inactive'} tab-focus`}
        >
          Tab One
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'two'}
          aria-controls="panel-two"
          id="tab-two"
          onClick={() => setActive('two')}
          className={`tab-base ${active === 'two' ? 'tab-active' : 'tab-inactive'} tab-focus`}
        >
          Tab Two
        </button>
      </div>
      <div className="pt-spacing-md">
        {active === 'one' ? (
          <div id="panel-one" role="tabpanel" aria-labelledby="tab-one" className="text-body text-text-primary">
            Content for Tab One.
          </div>
        ) : (
          <div id="panel-two" role="tabpanel" aria-labelledby="tab-two" className="text-body text-text-primary">
            Content for Tab Two.
          </div>
        )}
      </div>
    </div>
  );
}

function DropdownVariantsPreview() {
  const [selectedDefault, setSelectedDefault] = React.useState('original');
  const [selectedWithDescription, setSelectedWithDescription] = React.useState('classic');
  const [selectedCompact, setSelectedCompact] = React.useState('modern');
  const [selectedOnAccentDefault, setSelectedOnAccentDefault] = React.useState('original');
  const [selectedOnAccentWithDescription, setSelectedOnAccentWithDescription] = React.useState('classic');
  const [selectedOnAccentCompact, setSelectedOnAccentCompact] = React.useState('modern');

  const demoOptions = [
    { id: 'original', label: 'Original' },
    { id: 'classic', label: 'Classic', description: 'A timeless choice' },
    { id: 'modern', label: 'Modern', description: 'Clean and minimal style' },
  ];

  return (
    <div className="space-y-spacing-lg">
      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">Default</h3>
        <div className="w-64 h-32 bg-secondary flex items-center justify-center rounded-card">
          <div className="w-48">
            <Dropdown
              options={demoOptions}
              selectedId={selectedDefault}
              onSelect={setSelectedDefault}
              variant="default"
              ariaLabel="Select style variant"
              placeholder="Choose a style"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">With Description</h3>
        <div className="w-64">
          <Dropdown
            options={demoOptions}
            selectedId={selectedWithDescription}
            onSelect={setSelectedWithDescription}
            variant="withDescription"
            ariaLabel="Select style variant with description"
            placeholder="Choose a style"
          />
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">Compact</h3>
        <div className="w-64 h-32 bg-secondary flex items-center justify-center rounded-card">
          <div className="w-48">
            <Dropdown
              options={demoOptions}
              selectedId={selectedCompact}
              onSelect={setSelectedCompact}
              variant="compact"
              ariaLabel="Select style variant compact"
              placeholder="Choose a style"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">On Accent - Default</h3>
        <div className="bg-accent p-spacing-lg rounded-card">
          <div className="max-w-xs">
            <Dropdown
              options={demoOptions}
              selectedId={selectedOnAccentDefault}
              onSelect={setSelectedOnAccentDefault}
              variant="onAccent"
              ariaLabel="Select style variant on accent default"
              placeholder="Choose a style"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">On Accent - With Description</h3>
        <div className="bg-accent p-spacing-lg rounded-card">
          <div className="max-w-xs">
            <Dropdown
              options={demoOptions}
              selectedId={selectedOnAccentWithDescription}
              onSelect={setSelectedOnAccentWithDescription}
              variant="onAccentWithDescription"
              ariaLabel="Select style variant on accent with description"
              placeholder="Choose a style"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">On Accent - Compact</h3>
        <div className="bg-accent p-spacing-lg rounded-card">
          <div className="max-w-xs">
            <Dropdown
              options={demoOptions}
              selectedId={selectedOnAccentCompact}
              onSelect={setSelectedOnAccentCompact}
              variant="onAccentCompact"
              ariaLabel="Select style variant on accent compact"
              placeholder="Choose a style"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtraModalTriggers() {
  const [showLegalModal, setShowLegalModal] = React.useState(false);
  const [showKeepInTouch, setShowKeepInTouch] = React.useState(false);
  const [showPayAsYouGo, setShowPayAsYouGo] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowLegalModal(true)}
        className="inline-flex items-center justify-center rounded-[10px] py-[12px] px-[24px] gap-[12px] bg-accent text-text-primary font-semibold text-body transition-colors hover:bg-accent/80"
      >
        Open: Check Legal Stuff
      </button>
      <button
        type="button"
        onClick={() => setShowKeepInTouch(true)}
        className="inline-flex items-center justify-center rounded-[10px] py-[12px] px-[24px] gap-[12px] bg-accent text-text-primary font-semibold text-body transition-colors hover:bg-accent/80"
      >
        Open: Keep In Touch
      </button>
      <button
        type="button"
        onClick={() => setShowPayAsYouGo(true)}
        className="inline-flex items-center justify-center rounded-[10px] py-[12px] px-[24px] gap-[12px] bg-accent text-text-primary font-semibold text-body transition-colors hover:bg-accent/80"
      >
        Open: Pay As You Go
      </button>

      <CheckLegalStuffModal open={showLegalModal} onClose={() => setShowLegalModal(false)} />
      <KeepInTouchModal open={showKeepInTouch} onClose={() => setShowKeepInTouch(false)} />
      <PayAsYouGoModal open={showPayAsYouGo} onClose={() => setShowPayAsYouGo(false)} />
    </>
  );
}

function InputVariantsPreview() {
  const [defaultValue, setDefaultValue] = React.useState('');
  const [withDescriptionValue, setWithDescriptionValue] = React.useState('');
  const [compactValue, setCompactValue] = React.useState('');
  const [onAccentValue, setOnAccentValue] = React.useState('');
  const [onAccentWithDescriptionValue, setOnAccentWithDescriptionValue] = React.useState('');
  const [onAccentCompactValue, setOnAccentCompactValue] = React.useState('');

  return (
    <div className="space-y-spacing-lg">
      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">Default</h3>
        <div className="w-64 h-32 bg-secondary flex items-center justify-center rounded-card">
          <div className="w-48">
            <Input
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Enter text..."
              variant="default"
              label="Input Label"
              helperText="This is helper text"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">With Description</h3>
        <div className="w-64">
          <Input
            value={withDescriptionValue}
            onChange={(e) => setWithDescriptionValue(e.target.value)}
            placeholder="Enter text..."
            variant="withDescription"
            label="Input Label"
            helperText="This is helper text with description"
          />
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">Compact</h3>
        <div className="w-64 h-32 bg-secondary flex items-center justify-center rounded-card">
          <div className="w-48">
            <Input
              value={compactValue}
              onChange={(e) => setCompactValue(e.target.value)}
              placeholder="Enter text..."
              variant="compact"
              size="sm"
              label="Compact Input"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">On Accent - Default</h3>
        <div className="bg-accent p-spacing-lg rounded-card">
          <div className="max-w-xs">
            <Input
              value={onAccentValue}
              onChange={(e) => setOnAccentValue(e.target.value)}
              placeholder="Enter text..."
              variant="onAccent"
              label="Input Label"
              helperText="This is helper text"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">On Accent - With Description</h3>
        <div className="bg-accent p-spacing-lg rounded-card">
          <div className="max-w-xs">
            <Input
              value={onAccentWithDescriptionValue}
              onChange={(e) => setOnAccentWithDescriptionValue(e.target.value)}
              placeholder="Enter text..."
              variant="onAccentWithDescription"
              label="Input Label"
              helperText="This is helper text with description"
            />
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md">
        <h3 className="text-subheading text-text-secondary">On Accent - Compact</h3>
        <div className="bg-accent p-spacing-lg rounded-card">
          <div className="max-w-xs">
            <Input
              value={onAccentCompactValue}
              onChange={(e) => setOnAccentCompactValue(e.target.value)}
              placeholder="Enter text..."
              variant="onAccentCompact"
              size="sm"
              label="Compact Input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
