export type Camera3DControlMethod = 'xyz' | 'interactive';
export type Platform = 'win' | 'mac' | 'linux';

export type Recorder = {
  id: string;
  name: string;
  website: string;
  lastUpdatedAt?: string | null;
  lastUpdatedVersion?: string | null;
  platforms: Platform[] | null;
  appSizeMB: number | null;
  requiresRegistration: boolean | null;
  availableOnMacAppStore: boolean | null;
  isOpenSource: boolean | null;
  monthlyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  lifetimePrice: number | null;
  supportsScreenshots: boolean | null;
  supportsScrollingScreenshots?: boolean | null;
  supportsCopyText?: boolean | null;
  supportsBasicAnnotations: boolean | null;
  supportsCustomBackgrounds: boolean | null;
  supportsCustomCorners: boolean | null;
  supportsCustomShadows: boolean | null;
  supports3DEffects: boolean | null;
  supportsDeviceFrames: boolean | null;
  supportsResolutionControls: boolean | null;
  supportsDynamicBlurControls: boolean | null;
  supportsCurveControls: boolean | null;
  supportsSpeedControls: boolean | null;
  supportsDepthOfField: boolean | null;
  supportsDepthStrengthControls: boolean | null;
  supportsScreenReflection: boolean | null;
  camera3DControlMethod: Camera3DControlMethod | null;
  zoomLimit: number | null;
  accent: string;
  icon?: string;
} & Record<string, string | number | boolean | string[] | null | undefined>;

export type FieldGroupKey =
  | 'general' | 'pricing' | 'screenshots'
  | 'zoomEffects' | 'dynamicBlur' | 'animationAdjustments' | 'camera3d'
  | 'recording' | 'microphoneRecording' | 'systemAudioRecording' | 'cameraRecording'
  | 'customBackgrounds' | 'pictureAdjustments' | 'deviceFrames' | 'annotations'
  | 'cursor' | 'transcription' | 'backgroundMusic' | 'keystrokes'
  | 'exportSharing' | 'presets';

export type FieldGroupPreview =
  | { type: 'text'; label: string }
  | { type: 'boolean'; value: boolean | null };

export type FieldGroup = {
  key: FieldGroupKey;
  label: string;
  parentKey?: FieldGroupKey;
  getCollapsedPreview?: (recorder: Recorder) => FieldGroupPreview;
  defaultExpanded?: boolean;
};

export type FieldOption = { value: string; label: string; rank?: number };

export type FieldDefinition = {
  key: string;
  label: string;
  type: 'text' | 'url' | 'date' | 'price' | 'boolean' | 'number' | 'select' | 'select-text' | 'multiselect' | 'computed';
  required?: boolean;
  placeholder?: string;
  description?: string;
  group: FieldGroupKey;
  options?: FieldOption[];
  higherIsBetter?: boolean;
  booleanBest?: boolean;
  unit?: string;
};

const capabilityPreview = (keys: string[]) => (recorder: Recorder): FieldGroupPreview => {
  const values = keys.map((key) => recorder[key]);
  if (values.every((value) => value === null || value === undefined)) return { type: 'text', label: 'Unknown' };
  const supported = values.filter((value) => value === true || typeof value === 'number' || (typeof value === 'string' && value.length > 0) || (Array.isArray(value) && value.length > 0)).length;
  return { type: 'text', label: `${supported}/${keys.length}` };
};

export const fieldGroups: FieldGroup[] = [
  { key: 'general', label: 'General' },
  {
    key: 'pricing', label: 'Pricing', defaultExpanded: false,
    getCollapsedPreview: (recorder) => {
      const prices = [
        { value: recorder.monthlyPrice, suffix: '/ mo' },
        { value: recorder.quarterlyPrice, suffix: '/ qtr' },
        { value: recorder.yearlyPrice, suffix: '/ yr' },
        { value: recorder.lifetimePrice, suffix: 'once' },
      ].filter((item): item is { value: number; suffix: string } => item.value !== null);
      if (prices.length === 0) return { type: 'text', label: 'Unknown' };
      const cheapest = prices.reduce((best, item) => item.value < best.value ? item : best);
      if (cheapest.value === 0) return { type: 'text', label: 'Free' };
      return { type: 'text', label: `From $${cheapest.value} ${cheapest.suffix}` };
    },
  },
  { key: 'screenshots', label: 'Screenshots', defaultExpanded: false, getCollapsedPreview: (recorder) => ({ type: 'boolean', value: recorder.supportsScreenshots }) },
  { key: 'zoomEffects', label: 'Zoom effects', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsDynamicBlurControls', 'supportsCurveControls', 'supportsSpeedControls', 'supportsDepthOfField', 'supportsDepthStrengthControls', 'supportsScreenReflection', 'camera3DControlMethod', 'zoomLimit']) },
  { key: 'dynamicBlur', label: 'Dynamic blur', parentKey: 'zoomEffects', defaultExpanded: false, getCollapsedPreview: (recorder) => ({ type: 'boolean', value: recorder.supportsDynamicBlurControls }) },
  {
    key: 'animationAdjustments', label: 'Animation adjustments', parentKey: 'zoomEffects', defaultExpanded: false,
    getCollapsedPreview: capabilityPreview(['supportsCurveControls', 'supportsSpeedControls']),
  },
  {
    key: 'camera3d', label: '3D camera movement', parentKey: 'zoomEffects', defaultExpanded: false,
    getCollapsedPreview: (recorder) => recorder.camera3DControlMethod === 'interactive'
      ? { type: 'text', label: 'Interactive drag' }
      : recorder.camera3DControlMethod === 'xyz'
        ? { type: 'text', label: 'X / Y / Z' }
        : { type: 'text', label: 'Unknown' },
  },
  { key: 'recording', label: 'Recording', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsWindowRecordingMode', 'supportsMicrophoneRecording', 'supportsMicrophoneNoiseReduction', 'supportsSystemAudioRecording', 'supportsSystemAudioMultitrack', 'supportsKeystrokeRecording', 'supportsCameraBeauty', 'supportsCameraBackgroundRemoval', 'supportsCameraBackgroundReplacement', 'supportsIPhoneRecording', 'supportsAndroidRecording']) },
  { key: 'microphoneRecording', label: 'Microphone recording', parentKey: 'recording', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsMicrophoneRecording', 'supportsMicrophoneNoiseReduction']) },
  { key: 'systemAudioRecording', label: 'System audio recording', parentKey: 'recording', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsSystemAudioRecording', 'supportsSystemAudioMultitrack']) },
  { key: 'cameraRecording', label: 'Camera recording', parentKey: 'recording', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsCameraBeauty', 'supportsCameraBackgroundRemoval', 'supportsCameraBackgroundReplacement']) },
  { key: 'customBackgrounds', label: 'Custom backgrounds', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsCustomBackgrounds', 'supportsWallpaperBackground', 'supportsColorBackground', 'supportsGradientBackground', 'supportsVideoBackground', 'supportsCustomImageBackground', 'supportsCustomVideoBackground']) },
  { key: 'pictureAdjustments', label: 'Picture adjustments', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsAspectRatioAdjustment', 'supportsCropping', 'supportsCustomCorners', 'supportsSmoothCorners', 'supportsCustomShadows']) },
  { key: 'deviceFrames', label: 'Device frames', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsDeviceFrames', 'supportsIPhoneFrame', 'supportsIPadFrame', 'supportsAppleWatchFrame', 'supportsMacBookFrame', 'supportsMonitorFrame']) },
  { key: 'annotations', label: 'Annotations', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsBasicAnnotations', 'supportsMosaic', 'supportsTextAnnotations', 'supportsFocusEffect', 'supportsCustomImageAnnotations', 'supportsAnnotationOverlay']) },
  { key: 'cursor', label: 'Cursor', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsCursorToggle', 'supportsCursorAutoHide', 'supportsCursorStyleReplacement', 'supportsCustomCursorStyle', 'supportsClickSounds', 'supportsSeparatePressReleaseSounds', 'supportsClickEffects']) },
  { key: 'transcription', label: 'Subtitles & transcription', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsTranscription', 'supportsSubtitleEditing', 'supportsWordLevelEditing']) },
  { key: 'backgroundMusic', label: 'Background music', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsBackgroundMusic', 'supportsOfficialMusic', 'supportsLocalMusic', 'supportsMusicEditing', 'supportsMusicFade']) },
  { key: 'keystrokes', label: 'Keystrokes', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsAllKeyRecording', 'supportsShortcutRecording', 'supportsKeyStyleAdjustment', 'supportsKeyPositionAdjustment']) },
  { key: 'exportSharing', label: 'Export & sharing', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsVideoExport', 'supportsTransparentMovExport', 'supportsGifExport', 'supportsLivePhotoExport', 'supportsExportResolutionSelection', 'supportsExportQualitySelection', 'supportsExportFrameRateSelection', 'supportsExportSizeEstimate', 'supportsExportDurationEstimate', 'supportsShareLinks']) },
  { key: 'presets', label: 'Presets', defaultExpanded: false, getCollapsedPreview: capabilityPreview(['supportsPresets', 'supportsPresetImportExportSharing']) },
];

export const fieldDefinitions: FieldDefinition[] = [
  { key: 'name', label: 'Product name', type: 'text', group: 'general', required: true, placeholder: 'e.g. Screen Studio' },
  { key: 'website', label: 'Official website', type: 'url', group: 'general', required: true, placeholder: 'https://example.com' },
  { key: 'score', label: 'Score', type: 'computed', group: 'general', description: 'Computed from field values and their configurable weights.', higherIsBetter: true },
  { key: 'lastUpdatedAt', label: 'Last updated date', type: 'date', group: 'general', description: 'Date when this product information was last verified.' },
  { key: 'lastUpdatedVersion', label: 'App version', type: 'text', group: 'general', placeholder: 'e.g. 3.2.1', description: 'Application version corresponding to the last update.' },
  { key: 'technologyApproach', label: 'Technology approach', type: 'select-text', group: 'general', placeholder: 'Electron or Native', description: 'Choose a preset or enter another implementation approach.', options: [{ value: 'electron', label: 'Electron' }, { value: 'native', label: 'Native' }] },
  { key: 'platforms', label: 'Platforms', type: 'multiselect', group: 'general', higherIsBetter: true, options: [{ value: 'win', label: 'Windows' }, { value: 'mac', label: 'macOS' }, { value: 'linux', label: 'Linux' }] },
  { key: 'appSizeMB', label: 'Application size', type: 'number', group: 'general', placeholder: '100', description: 'Installed or download size in MB.', unit: 'MB' },
  { key: 'requiresRegistration', label: 'Registration required', type: 'boolean', group: 'general', booleanBest: false },
  { key: 'availableOnMacAppStore', label: 'Available on Mac App Store', type: 'boolean', group: 'general', booleanBest: true },
  { key: 'isOpenSource', label: 'Open source', type: 'boolean', group: 'general', booleanBest: true },
  { key: 'monthlyPrice', label: 'Monthly price', type: 'price', group: 'pricing', placeholder: '0', description: 'USD. Leave empty if unavailable.', unit: '/ mo' },
  { key: 'quarterlyPrice', label: 'Quarterly price', type: 'price', group: 'pricing', placeholder: '0', description: 'USD billed every three months.', unit: '/ qtr' },
  { key: 'yearlyPrice', label: 'Annual price', type: 'price', group: 'pricing', placeholder: '0', description: 'USD billed per year.', unit: '/ yr' },
  { key: 'lifetimePrice', label: 'Lifetime price', type: 'price', group: 'pricing', placeholder: '0', description: 'USD. Leave empty if unavailable.' },
  { key: 'supportsScreenshots', label: 'Window screenshot support', type: 'boolean', group: 'screenshots', description: 'Can capture a specific application window.' },
  { key: 'supportsScrollingScreenshots', label: 'Scrolling screenshots', type: 'boolean', group: 'screenshots', description: 'Can capture content beyond the visible viewport as one continuous image.' },
  { key: 'supportsCopyText', label: 'Copy text', type: 'boolean', group: 'screenshots', description: 'Can recognize and copy text from a screenshot.' },
  { key: 'supportsBasicAnnotations', label: 'Basic annotations', type: 'boolean', group: 'annotations', description: 'Supports basic arrows, text, shapes, or highlighting.' },
  { key: 'supportsCustomBackgrounds', label: 'Supported', type: 'boolean', group: 'customBackgrounds', description: 'Can customize the recording or screenshot background.' },
  { key: 'supportsCustomCorners', label: 'Corner radius controls', type: 'boolean', group: 'pictureAdjustments', description: 'Can adjust picture corner rounding.' },
  { key: 'supportsCustomShadows', label: 'Shadow controls', type: 'boolean', group: 'pictureAdjustments', description: 'Can customize picture shadows.' },
  { key: 'supports3DEffects', label: '3D effects', type: 'boolean', group: 'screenshots', description: 'Supports perspective or three-dimensional presentation effects.' },
  { key: 'supportsDeviceFrames', label: 'Supported', type: 'boolean', group: 'deviceFrames', description: 'Can place recordings or screenshots inside device mockups.' },
  { key: 'supportsResolutionControls', label: 'Resolution and clarity controls', type: 'boolean', group: 'screenshots', description: 'Can adjust output resolution or image clarity.' },
  { key: 'supportsDynamicBlurControls', label: 'Dynamic blur effect controls', type: 'boolean', group: 'dynamicBlur' },
  { key: 'supportsCurveControls', label: 'Curve controls', type: 'boolean', group: 'animationAdjustments' },
  { key: 'supportsSpeedControls', label: 'Speed controls', type: 'boolean', group: 'animationAdjustments' },
  { key: 'supportsDepthOfField', label: 'Depth of field', type: 'boolean', group: 'camera3d' },
  { key: 'supportsDepthStrengthControls', label: 'Depth strength controls', type: 'boolean', group: 'camera3d' },
  { key: 'supportsScreenReflection', label: 'Screen reflection simulation', type: 'boolean', group: 'camera3d' },
  {
    key: 'camera3DControlMethod', label: '3D adjustment method', type: 'select', group: 'camera3d', higherIsBetter: true,
    options: [
      { value: 'xyz', label: 'Separate X / Y / Z controls', rank: 1 },
      { value: 'interactive', label: 'Interactive drag', rank: 2 },
    ],
  },
  { key: 'zoomLimit', label: 'Zoom limit', type: 'number', group: 'zoomEffects', placeholder: '2', description: 'Maximum supported zoom multiplier.', unit: '×', higherIsBetter: true },

  { key: 'supportsWindowRecordingMode', label: 'Window mode', type: 'boolean', group: 'recording' },
  { key: 'supportsKeystrokeRecording', label: 'Keystroke recording', type: 'boolean', group: 'recording' },
  { key: 'supportsIPhoneRecording', label: 'iPhone recording', type: 'boolean', group: 'recording' },
  { key: 'supportsAndroidRecording', label: 'Android recording', type: 'boolean', group: 'recording' },
  { key: 'supportsMicrophoneRecording', label: 'Supported', type: 'boolean', group: 'microphoneRecording' },
  { key: 'supportsMicrophoneNoiseReduction', label: 'Noise reduction', type: 'boolean', group: 'microphoneRecording' },
  { key: 'supportsSystemAudioRecording', label: 'Supported', type: 'boolean', group: 'systemAudioRecording' },
  { key: 'supportsSystemAudioMultitrack', label: 'Multiple audio tracks', type: 'boolean', group: 'systemAudioRecording' },
  { key: 'supportsCameraBeauty', label: 'Beauty effects', type: 'boolean', group: 'cameraRecording' },
  { key: 'supportsCameraBackgroundRemoval', label: 'Background removal', type: 'boolean', group: 'cameraRecording' },
  { key: 'supportsCameraBackgroundReplacement', label: 'Background replacement', type: 'boolean', group: 'cameraRecording' },

  { key: 'supportsWallpaperBackground', label: 'Wallpapers', type: 'boolean', group: 'customBackgrounds' },
  { key: 'supportsColorBackground', label: 'Colors', type: 'boolean', group: 'customBackgrounds' },
  { key: 'supportsGradientBackground', label: 'Gradients', type: 'boolean', group: 'customBackgrounds' },
  { key: 'supportsVideoBackground', label: 'Videos', type: 'boolean', group: 'customBackgrounds' },
  { key: 'supportsCustomImageBackground', label: 'Custom images', type: 'boolean', group: 'customBackgrounds' },
  { key: 'supportsCustomVideoBackground', label: 'Custom videos', type: 'boolean', group: 'customBackgrounds' },

  { key: 'supportsAspectRatioAdjustment', label: 'Aspect ratio adjustment', type: 'boolean', group: 'pictureAdjustments' },
  { key: 'supportsCropping', label: 'Cropping', type: 'boolean', group: 'pictureAdjustments' },
  { key: 'supportsSmoothCorners', label: 'Smooth corners', type: 'boolean', group: 'pictureAdjustments' },

  { key: 'supportsIPhoneFrame', label: 'iPhone', type: 'boolean', group: 'deviceFrames' },
  { key: 'supportsIPadFrame', label: 'iPad', type: 'boolean', group: 'deviceFrames' },
  { key: 'supportsAppleWatchFrame', label: 'Apple Watch', type: 'boolean', group: 'deviceFrames' },
  { key: 'supportsMacBookFrame', label: 'MacBook', type: 'boolean', group: 'deviceFrames' },
  { key: 'supportsMonitorFrame', label: 'Monitor', type: 'boolean', group: 'deviceFrames' },

  { key: 'supportsMosaic', label: 'Mosaic', type: 'boolean', group: 'annotations' },
  { key: 'supportsTextAnnotations', label: 'Text', type: 'boolean', group: 'annotations' },
  { key: 'supportsFocusEffect', label: 'Focus effect', type: 'boolean', group: 'annotations' },
  { key: 'supportsCustomImageAnnotations', label: 'Custom images', type: 'boolean', group: 'annotations' },
  { key: 'supportsAnnotationOverlay', label: 'Overlay support', type: 'boolean', group: 'annotations' },

  { key: 'supportsCursorToggle', label: 'Cursor toggle', type: 'boolean', group: 'cursor' },
  { key: 'supportsCursorAutoHide', label: 'Hide while idle', type: 'boolean', group: 'cursor' },
  { key: 'supportsCursorStyleReplacement', label: 'Replace cursor style', type: 'boolean', group: 'cursor' },
  { key: 'supportsCustomCursorStyle', label: 'Custom cursor styles', type: 'boolean', group: 'cursor', description: 'Can use custom uploaded assets, skill-generated packs, or other custom cursor resources.' },
  { key: 'supportsClickSounds', label: 'Click sounds', type: 'boolean', group: 'cursor' },
  { key: 'supportsSeparatePressReleaseSounds', label: 'Separate press and release sounds', type: 'boolean', group: 'cursor' },
  { key: 'supportsClickEffects', label: 'Click effects', type: 'boolean', group: 'cursor' },

  { key: 'supportsTranscription', label: 'Transcription support', type: 'boolean', group: 'transcription' },
  { key: 'transcriptionProviders', label: 'Transcription providers', type: 'multiselect', group: 'transcription', options: [{ value: 'apple', label: 'Apple' }, { value: 'local-whisper-kit', label: 'Local WhisperKit' }, { value: 'byok', label: 'BYOK' }, { value: 'official-api', label: 'Official API' }] },
  { key: 'supportsSubtitleEditing', label: 'Subtitle editing', type: 'boolean', group: 'transcription' },
  { key: 'supportsWordLevelEditing', label: 'Word-level editing', type: 'boolean', group: 'transcription' },
  { key: 'subtitleOutputType', label: 'Subtitle output', type: 'select', group: 'transcription', options: [{ value: 'file', label: 'Subtitle file export', rank: 1 }, { value: 'burned-in', label: 'Burned in', rank: 1 }, { value: 'both', label: 'Both', rank: 2 }] },

  { key: 'supportsBackgroundMusic', label: 'Supported', type: 'boolean', group: 'backgroundMusic' },
  { key: 'supportsOfficialMusic', label: 'Official library', type: 'boolean', group: 'backgroundMusic' },
  { key: 'supportsLocalMusic', label: 'Local media', type: 'boolean', group: 'backgroundMusic' },
  { key: 'supportsMusicEditing', label: 'Editing and stitching', type: 'boolean', group: 'backgroundMusic' },
  { key: 'supportsMusicFade', label: 'Fade in / out', type: 'boolean', group: 'backgroundMusic' },

  { key: 'supportsAllKeyRecording', label: 'Record all keys', type: 'boolean', group: 'keystrokes' },
  { key: 'supportsShortcutRecording', label: 'Record shortcuts', type: 'boolean', group: 'keystrokes' },
  { key: 'supportsKeyStyleAdjustment', label: 'Key style adjustment', type: 'boolean', group: 'keystrokes' },
  { key: 'supportsKeyPositionAdjustment', label: 'Key position adjustment', type: 'boolean', group: 'keystrokes' },

  { key: 'supportsVideoExport', label: 'Video export', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsTransparentMovExport', label: 'Transparent MOV export', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsGifExport', label: 'GIF export', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsLivePhotoExport', label: 'Live Photo export', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsExportResolutionSelection', label: 'Resolution selection', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsExportQualitySelection', label: 'Quality selection', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsExportFrameRateSelection', label: 'Frame rate selection', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsExportSizeEstimate', label: 'Export size estimate', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsExportDurationEstimate', label: 'Export duration estimate', type: 'boolean', group: 'exportSharing' },
  { key: 'supportsShareLinks', label: 'Share links', type: 'boolean', group: 'exportSharing' },

  { key: 'supportsPresets', label: 'Supported', type: 'boolean', group: 'presets' },
  { key: 'supportsPresetImportExportSharing', label: 'Import / export / share', type: 'boolean', group: 'presets' },
];

export const recorders: Recorder[] = [
  { id:'screen-studio', name:'Screen Studio', website:'https://screen.studio', platforms:['mac'], appSizeMB:38, requiresRegistration:true, availableOnMacAppStore:true, isOpenSource:false, monthlyPrice:29, quarterlyPrice:null, yearlyPrice:229, lifetimePrice:null, supportsScreenshots:true, supportsBasicAnnotations:true, supportsCustomBackgrounds:true, supportsCustomCorners:true, supportsCustomShadows:true, supports3DEffects:true, supportsDeviceFrames:true, supportsResolutionControls:true, supportsDynamicBlurControls:true, supportsCurveControls:true, supportsSpeedControls:true, supportsDepthOfField:true, supportsDepthStrengthControls:true, supportsScreenReflection:true, camera3DControlMethod:'interactive', zoomLimit:3, accent:'#7065f0', icon:'/screen-studio.webp' },
  { id:'cleanshot', name:'CleanShot X', website:'https://cleanshot.com', platforms:['mac'], appSizeMB:72, requiresRegistration:false, availableOnMacAppStore:false, isOpenSource:false, monthlyPrice:null, quarterlyPrice:null, yearlyPrice:29, lifetimePrice:29, supportsScreenshots:true, supportsBasicAnnotations:true, supportsCustomBackgrounds:true, supportsCustomCorners:true, supportsCustomShadows:true, supports3DEffects:false, supportsDeviceFrames:false, supportsResolutionControls:true, supportsDynamicBlurControls:false, supportsCurveControls:false, supportsSpeedControls:false, supportsDepthOfField:false, supportsDepthStrengthControls:false, supportsScreenReflection:false, camera3DControlMethod:null, zoomLimit:1, accent:'#2d8cff' },
  { id:'screenflow', name:'ScreenFlow', website:'https://telestream.net/screenflow', platforms:['mac'], appSizeMB:980, requiresRegistration:true, availableOnMacAppStore:true, isOpenSource:false, monthlyPrice:null, quarterlyPrice:null, yearlyPrice:null, lifetimePrice:169, supportsScreenshots:false, supportsBasicAnnotations:false, supportsCustomBackgrounds:false, supportsCustomCorners:false, supportsCustomShadows:false, supports3DEffects:false, supportsDeviceFrames:false, supportsResolutionControls:false, supportsDynamicBlurControls:true, supportsCurveControls:true, supportsSpeedControls:true, supportsDepthOfField:false, supportsDepthStrengthControls:false, supportsScreenReflection:false, camera3DControlMethod:'xyz', zoomLimit:2, accent:'#f08a4b' },
  { id:'loom', name:'Loom', website:'https://loom.com', platforms:['win','mac'], appSizeMB:126, requiresRegistration:true, availableOnMacAppStore:false, isOpenSource:false, monthlyPrice:18, quarterlyPrice:null, yearlyPrice:150, lifetimePrice:null, supportsScreenshots:true, supportsBasicAnnotations:true, supportsCustomBackgrounds:false, supportsCustomCorners:false, supportsCustomShadows:false, supports3DEffects:false, supportsDeviceFrames:false, supportsResolutionControls:false, supportsDynamicBlurControls:true, supportsCurveControls:false, supportsSpeedControls:true, supportsDepthOfField:false, supportsDepthStrengthControls:false, supportsScreenReflection:false, camera3DControlMethod:null, zoomLimit:1, accent:'#625df5' },
  { id:'obs', name:'OBS Studio', website:'https://obsproject.com', platforms:['win','mac','linux'], appSizeMB:150, requiresRegistration:false, availableOnMacAppStore:false, isOpenSource:true, monthlyPrice:0, quarterlyPrice:0, yearlyPrice:0, lifetimePrice:0, supportsScreenshots:false, supportsBasicAnnotations:false, supportsCustomBackgrounds:false, supportsCustomCorners:false, supportsCustomShadows:false, supports3DEffects:false, supportsDeviceFrames:false, supportsResolutionControls:false, supportsDynamicBlurControls:false, supportsCurveControls:false, supportsSpeedControls:false, supportsDepthOfField:false, supportsDepthStrengthControls:false, supportsScreenReflection:false, camera3DControlMethod:null, zoomLimit:null, accent:'#333333' },
  { id:'tella', name:'Tella', website:'https://tella.tv', platforms:['win','mac'], appSizeMB:118, requiresRegistration:true, availableOnMacAppStore:false, isOpenSource:false, monthlyPrice:19, quarterlyPrice:null, yearlyPrice:144, lifetimePrice:null, supportsScreenshots:false, supportsBasicAnnotations:false, supportsCustomBackgrounds:true, supportsCustomCorners:true, supportsCustomShadows:true, supports3DEffects:false, supportsDeviceFrames:false, supportsResolutionControls:true, supportsDynamicBlurControls:true, supportsCurveControls:true, supportsSpeedControls:true, supportsDepthOfField:true, supportsDepthStrengthControls:false, supportsScreenReflection:false, camera3DControlMethod:'xyz', zoomLimit:2, accent:'#ff5b45' },
];

export const displayDomain = (website: string) => website.replace(/^https?:\/\//, '').split('/')[0];
