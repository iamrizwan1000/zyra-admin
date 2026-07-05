# Photo Picker — Camera, Crop, and Compress to < 100 KB

## Purpose

Replace the basic gallery-only image picker with a full-featured solution: camera capture, cropping, and automatic compression to under 100 KB per image.

## Changes

### Library swap
- Remove `react-native-image-picker`
- Add `react-native-image-crop-picker` (camera + gallery + native crop UI)
- Add `@bam.tech/react-native-image-resizer` (fallback resize for < 100 KB guarantee)

### New function: `pickAndCropImage(sourceType: 'camera' | 'gallery')`
Located in `src/lib/storage.ts`

1. Opens `ImagePicker.openCamera()` or `ImagePicker.openPicker()` with `cropping: true`, `compressImageMaxWidth: 1200`, `compressImageQuality: 0.7`
2. If result file size > 100 KB, iterates through quality levels (70, 50, 30, 10) via `react-native-image-resizer` scaling to `1200px` width
3. If still > 100 KB at quality 10, reduces max width to `800px` → `600px` and retries
4. Returns `{uri, fileName, type, base64?}` (same shape as current `PickedImage`)

### Photo grid UI (both CreateListingScreen and EditListingScreen)
- 3-column responsive grid: thumbnail width = `(screenWidth - horizontalPadding - 2 * gap) / 3`
- Thumbnails: `120px` height, rounded corners (`borderRadius: 8`), shadow
- Each thumbnail: remove button (X circle), cover badge on first
- Add card: dashed border, `+` icon
- ActionSheet (iOS `ActionSheetIOS`, Android `Alert` with buttons) on add-card tap: "Take Photo" / "Choose from Gallery" / "Cancel"
- Header label: "Photos (3/6)"
- Max 6 photos (changed from 8)

### Permissions
- **iOS**: add `NSCameraUsageDescription` to `Info.plist` — "Vendo needs camera access to take listing photos."
- **Android**: add `<uses-permission android:name="android.permission.CAMERA"/>` and `<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>` to `AndroidManifest.xml`

### Constants
- `MAX_PHOTOS = 6` (replace all `8` references)
- `TARGET_FILE_SIZE = 100 * 1024` (bytes)
- `INITIAL_MAX_WIDTH = 1200`
- `COMPRESSION_QUALITIES = [70, 50, 30, 10]`

## Files
| File | Change |
|---|---|
| `package.json` | Remove `react-native-image-picker`, add `react-native-image-crop-picker`, add `@bam.tech/react-native-image-resizer` |
| `src/lib/storage.ts` | Replace `pickImage()` with `pickAndCropImage(sourceType)` |
| `src/screens/sell/CreateListingScreen.tsx` | Photo grid UI, ActionSheet, constant |
| `src/screens/sell/EditListingScreen.tsx` | Photo grid UI, ActionSheet, constant |
| `ios/mobile/Info.plist` | Add `NSCameraUsageDescription` |
| `android/app/src/main/AndroidManifest.xml` | Add camera permissions |

## Edge cases
- Camera not available (simulator): crop-picker rejects → show error toast
- Image still > 100 KB after all retries: use smallest version anyway (100 KB is a soft target)
- User cancels crop: return null (same as current cancel behavior)
- Photo count at max (6): hide add card
