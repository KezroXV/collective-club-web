/**
 * Système d'animations premium pour shadcn UI
 * Animations fluides avec support prefers-reduced-motion
 */

// Durées d'animation standardisées
export const ANIMATION_DURATION = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// Fonctions de temporisation (easing)
export const ANIMATION_EASING = {
  ease: 'ease',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Classes CSS d'animations pour composants shadcn
export const ANIMATION_CLASSES = {
  // Animations d'entrée
  fadeIn: 'animate-in fade-in duration-200',
  fadeInUp: 'animate-in fade-in slide-in-from-bottom-2 duration-200',
  fadeInDown: 'animate-in fade-in slide-in-from-top-2 duration-200',
  fadeInLeft: 'animate-in fade-in slide-in-from-left-2 duration-200',
  fadeInRight: 'animate-in fade-in slide-in-from-right-2 duration-200',
  
  // Animations de sortie
  fadeOut: 'animate-out fade-out duration-150',
  fadeOutUp: 'animate-out fade-out slide-out-to-top-2 duration-150',
  fadeOutDown: 'animate-out fade-out slide-out-to-bottom-2 duration-150',
  fadeOutLeft: 'animate-out fade-out slide-out-to-left-2 duration-150',
  fadeOutRight: 'animate-out fade-out slide-out-to-right-2 duration-150',
  
  // Animations de zoom
  zoomIn: 'animate-in zoom-in-95 duration-200',
  zoomOut: 'animate-out zoom-out-95 duration-150',
  
  // Animations staggerées pour listes
  staggerItem: 'animate-in fade-in slide-in-from-bottom-1 duration-300',
  
  // Hover animations
  hoverScale: 'transition-transform duration-200 hover:scale-[1.02]',
  hoverLift: 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
  hoverGlow: 'transition-all duration-200 hover:shadow-lg hover:shadow-primary/20',
  
  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  
  // Button specific
  buttonPress: 'active:scale-[0.98] transition-transform duration-75',
  buttonHover: 'transition-all duration-200 hover:shadow-md',
  
  // Card specific
  cardHover: 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
  cardFloat: 'transition-all duration-500 hover:shadow-2xl hover:-translate-y-2',
  
  // Badge specific
  badgePulse: 'animate-pulse duration-1000',
  badgeShimmer: 'bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-[shimmer_2s_infinite]',
} as const;

// Animations spécifiques aux états
export const STATE_ANIMATIONS = {
  // États de chargement
  loading: 'animate-pulse opacity-50',
  loadingSpinner: 'animate-spin',
  
  // États de succès/erreur
  success: 'animate-in fade-in zoom-in-95 duration-300',
  error: 'animate-in fade-in zoom-in-95 duration-300 animate-bounce',
  
  // États de focus
  focusRing: 'focus-visible:animate-in focus-visible:fade-in duration-150',
  
  // États disabled
  disabled: 'opacity-50 cursor-not-allowed',
} as const;

// Utilitaires pour animations conditionnelles
export const createConditionalAnimation = (condition: boolean, animationClass: string) => {
  return condition ? animationClass : '';
};

// Délais pour animations staggerées
export const STAGGER_DELAYS = {
  children: 'delay-75',
  items: 'delay-100',
  cards: 'delay-150',
} as const;

// Classes pour préférences utilisateur
export const MOTION_SAFE_ANIMATIONS = {
  // Uniquement si prefers-reduced-motion: no-preference
  motionSafe: 'motion-safe:animate-in motion-safe:fade-in',
  motionSafeSlide: 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
  motionSafeScale: 'motion-safe:transition-transform motion-safe:hover:scale-105',
} as const;

// Fonction helper pour combiner animations
export const combineAnimations = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Presets d'animations par type de composant
export const COMPONENT_ANIMATIONS = {
  button: {
    base: 'transition-all duration-200',
    hover: 'hover:shadow-md hover:-translate-y-0.5',
    press: 'active:scale-[0.98]',
    loading: 'animate-pulse opacity-75',
  },
  card: {
    base: 'transition-all duration-300',
    hover: 'hover:shadow-xl hover:-translate-y-1',
    float: 'hover:shadow-2xl hover:-translate-y-2',
  },
  dialog: {
    overlay: 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    content: 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  },
  input: {
    base: 'transition-all duration-200',
    focus: 'focus-visible:animate-in focus-visible:fade-in',
    error: 'animate-in fade-in zoom-in-95 duration-200',
  },
  badge: {
    base: 'transition-all duration-200',
    hover: 'hover:scale-105',
    pulse: 'animate-pulse duration-1000',
  },
  tabs: {
    trigger: 'transition-all duration-200',
    content: 'animate-in fade-in slide-in-from-bottom-1 duration-300',
  },
} as const;