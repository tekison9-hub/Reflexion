# Tutorial UI Prefab Setup Guide

This guide will walk you through creating all the required UI prefabs for the Reflexion Tutorial System.

## Table of Contents
1. [Canvas Setup](#canvas-setup)
2. [Overlay Background](#overlay-background)
3. [Spotlight Mask](#spotlight-mask)
4. [Instruction Panel](#instruction-panel)
5. [Hand Pointer](#hand-pointer)
6. [Skip UI](#skip-ui)
7. [Completion Modal](#completion-modal)
8. [Final Assembly](#final-assembly)

---

## Canvas Setup

### 1. Create Tutorial Canvas

1. Right-click in Hierarchy → **UI → Canvas**
2. Rename to **"TutorialCanvas"**
3. Select TutorialCanvas, in Inspector:

```
Canvas:
  Render Mode: Screen Space - Overlay
  Pixel Perfect: ☑ (checked)
  Sort Order: 100 (render on top of game UI)

Canvas Scaler:
  UI Scale Mode: Scale With Screen Size
  Reference Resolution: X: 1080, Y: 1920
  Screen Match Mode: Match Width Or Height
  Match: 0.5
  Reference Pixels Per Unit: 100
```

4. Add **CanvasGroup** component:
   - Alpha: 1
   - Interactable: ☑
   - Block Raycasts: ☑

5. Add **TutorialUIController** script

---

## Overlay Background

Creates the dimmed background effect.

### Create Overlay

1. Right-click TutorialCanvas → **UI → Image**
2. Rename to **"OverlayBackground"**

### Configure

```
RectTransform:
  Anchors: Stretch (all sides)
  Left: 0, Top: 0, Right: 0, Bottom: 0
  Pivot: (0.5, 0.5)

Image:
  Color: (0, 0, 0, 180) - Black with 70% opacity
  Raycast Target: ☑ (blocks touches to game)
```

### Visual Result
Full-screen semi-transparent black overlay that dims the game.

---

## Spotlight Mask

Highlights the current target with a circular spotlight effect.

### Create Spotlight

1. Right-click TutorialCanvas → **UI → Image**
2. Rename to **"SpotlightMask"**

### Configure

```
RectTransform:
  Anchors: Center
  Width: 300
  Height: 300
  Pivot: (0.5, 0.5)

Image:
  Source Image: Circle sprite (create or import)
  Color: White (255, 255, 255, 255)
  Raycast Target: ☐ (unchecked)
```

### Create Circle Sprite

**Option 1: Use Unity Default**
- In Project: Right-click → Create → Sprites → Circle

**Option 2: Import Custom**
- Create 512x512 white circle with soft edges in image editor
- Import as Sprite (2D and UI)
- Set Texture Type: Sprite (2D and UI)

### Advanced: Spotlight Shader (Optional)

For better visual effect, create a custom spotlight shader:

```shader
Shader "Tutorial/Spotlight"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Tint", Color) = (1,1,1,1)
        _Center ("Center", Vector) = (0.5, 0.5, 0, 0)
        _Radius ("Radius", Float) = 0.3
        _Softness ("Softness", Float) = 0.1
    }
    SubShader
    {
        Tags { "Queue"="Overlay" "RenderType"="Transparent" }
        Blend SrcAlpha OneMinusSrcAlpha
        
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            
            struct appdata { float4 vertex : POSITION; float2 uv : TEXCOORD0; };
            struct v2f { float2 uv : TEXCOORD0; float4 vertex : SV_POSITION; };
            
            sampler2D _MainTex;
            float4 _Color;
            float2 _Center;
            float _Radius;
            float _Softness;
            
            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                return o;
            }
            
            fixed4 frag (v2f i) : SV_Target
            {
                float dist = distance(i.uv, _Center);
                float alpha = smoothstep(_Radius, _Radius - _Softness, dist);
                return fixed4(_Color.rgb, alpha * _Color.a);
            }
            ENDCG
        }
    }
}
```

---

## Instruction Panel

Displays step-by-step instructions to the player.

### Create Panel

1. Right-click TutorialCanvas → **UI → Panel**
2. Rename to **"InstructionPanel"**

### Configure Panel

```
RectTransform:
  Anchors: Top Center
  Pos X: 0, Pos Y: -200
  Width: 900, Height: 200
  Pivot: (0.5, 1)

Image (Background):
  Source Image: UI-Background sprite (or create rounded rectangle)
  Color: (20, 20, 40, 230) - Dark blue with slight transparency
  Material: UI-Default
```

### Add Background Shadow (Optional)

1. Right-click InstructionPanel → **UI → Image**
2. Rename to **"Shadow"**
3. Configure:
   ```
   RectTransform:
     Anchors: Stretch
     Left: 10, Top: -10, Right: -10, Bottom: 10
   
   Image:
     Color: (0, 0, 0, 100)
   
   Position: Move behind InstructionPanel in hierarchy
   ```

### Add Instruction Text

1. Right-click InstructionPanel → **UI → Text - TextMeshPro**
2. Rename to **"InstructionText"**

```
RectTransform:
  Anchors: Stretch
  Left: 50, Top: 50, Right: 50, Bottom: 50

TextMeshProUGUI:
  Text: "Tap the glowing target"
  Font: Roboto Bold (or similar sans-serif)
  Font Size: 48
  Alignment: Center Middle
  Color: White (255, 255, 255, 255)
  Auto Size: ☐
  Word Wrapping: ☑
  Overflow: Ellipsis

Extra Settings:
  Enable Rich Text: ☑
  Shadow: ☑
    Shadow Offset: (2, -2)
    Shadow Color: (0, 0, 0, 128)
```

### Add CanvasGroup

Add **CanvasGroup** component to InstructionPanel for fade animations:
- Alpha: 1
- Interactable: ☐
- Block Raycasts: ☐

---

## Hand Pointer

Animated hand that guides the player where to tap.

### Create Hand Pointer

1. Right-click TutorialCanvas → **UI → Image**
2. Rename to **"HandPointer"**

### Configure

```
RectTransform:
  Anchors: Center
  Width: 128, Height: 128
  Pivot: (0.5, 0.5)
  Rotation: 0

Image:
  Source Image: Hand_Pointer sprite (see below)
  Color: White (255, 255, 255, 255)
  Raycast Target: ☐
  Preserve Aspect: ☑
```

### Hand Sprite

**Create or Import:**

Option 1: **Use Unicode Emoji** (Quick method)
- Create text: "👆" (pointing up finger emoji)
- Export as image
- Import as sprite

Option 2: **Download Free Icon**
- Search "pointing hand icon PNG"
- Recommended sites: flaticon.com, icons8.com
- Import as Sprite (2D and UI)

Option 3: **Create Custom** (Best quality)
- Create 256x256 white hand silhouette in image editor
- Pointing finger with slight angle
- Export as PNG with transparency

### Add HandPointerAnimator Script

1. Select HandPointer GameObject
2. Add Component → **HandPointerAnimator** script

### Add CanvasGroup

Add **CanvasGroup** component for fade animations:
- Alpha: 1
- Interactable: ☐
- Block Raycasts: ☐

### Optional: Add Animator

For advanced animations using Unity's Animator:

1. Create **HandPointer** animation clip:
   ```
   0.0s: Scale (1, 1, 1), Position Y: 0
   0.3s: Scale (0.8, 0.8, 1), Position Y: -20
   0.6s: Scale (1, 1, 1), Position Y: 0
   ```

2. Create Animator Controller:
   - Create "Idle" state with HandPointer animation
   - Loop: ☑

---

## Skip UI

Allows returning users to skip the tutorial.

### Create Skip Container

1. Right-click TutorialCanvas → **UI → Panel**
2. Rename to **"SkipUI"**

```
RectTransform:
  Anchors: Top Right
  Pos X: -100, Pos Y: -100
  Width: 200, Height: 120

Image:
  Color: Transparent (0, 0, 0, 0)
  Raycast Target: ☐
```

### Skip Hold Indicator

1. Right-click SkipUI → **UI → Image**
2. Rename to **"SkipHoldIndicator"**

```
RectTransform:
  Anchors: Stretch
  Left: 0, Top: 0, Right: 0, Bottom: 0

Image:
  Source Image: Circle or rounded rectangle
  Color: (255, 255, 255, 50)
  Raycast Target: ☐
```

#### Add Skip Text

1. Right-click SkipHoldIndicator → **UI → Text - TextMeshPro**
2. Rename to **"SkipText"**

```
TextMeshProUGUI:
  Text: "Hold ESC to Skip"
  Font Size: 24
  Alignment: Center Middle
  Color: White
```

#### Add Progress Bar

1. Right-click SkipHoldIndicator → **UI → Image**
2. Rename to **"SkipProgressBar"**

```
RectTransform:
  Anchors: Bottom Stretch
  Left: 10, Right: 10
  Height: 8
  Pos Y: 20

Image:
  Source Image: UI-Sprite (square)
  Image Type: Filled
  Fill Method: Horizontal
  Fill Origin: Left
  Fill Amount: 0
  Color: (0, 200, 255, 255) - Cyan
```

### Skip Confirmation Panel

1. Right-click SkipUI → **UI → Panel**
2. Rename to **"SkipConfirmationPanel"**
3. Initially disabled (uncheck in Inspector)

```
RectTransform:
  Anchors: Center
  Width: 700, Height: 400
  Pivot: (0.5, 0.5)

Image:
  Color: (40, 40, 60, 240)
```

#### Add Confirmation Text

```
Text: "Skip Tutorial?"
Font Size: 56
Alignment: Top Center
Position: Top of panel
```

#### Add Warning Text

```
Text: "You can restart tutorial from settings"
Font Size: 28
Alignment: Center
Color: (200, 200, 200, 255)
```

#### Add Confirm Button

1. Right-click SkipConfirmationPanel → **UI → Button - TextMeshPro**
2. Rename to **"SkipConfirmButton"**

```
RectTransform:
  Anchors: Bottom Center
  Pos Y: 100
  Width: 300, Height: 80

Button:
  Interactable: ☑
  Transition: Color Tint
  Normal Color: (255, 60, 60, 255) - Red
  Highlighted Color: (255, 100, 100, 255)
  Pressed Color: (200, 40, 40, 255)

Text:
  Text: "Skip"
  Font Size: 40
  Alignment: Center Middle
  Color: White
```

#### Add Cancel Button

Similar to Confirm Button:
```
Position: Bottom Center, Pos Y: 20
Normal Color: (80, 80, 100, 255) - Gray
Text: "Continue Tutorial"
```

---

## Completion Modal

Congratulatory screen shown after tutorial completion.

### Create Modal

1. Right-click TutorialCanvas → **UI → Panel**
2. Rename to **"CompletionModal"**
3. Initially disabled

```
RectTransform:
  Anchors: Center
  Width: 800, Height: 1000
  Pivot: (0.5, 0.5)

Image:
  Color: (20, 30, 50, 250)
  Raycast Target: ☑
```

### Add Celebration Icon

1. Right-click CompletionModal → **UI → Image**
2. Rename to **"CelebrationIcon"**

```
Position: Top center of modal
Size: 200x200
Image: Trophy or star icon (🏆 ⭐)
Color: Gold (255, 215, 0, 255)
```

### Add Completion Message

```
Text: "You're ready!"
Font Size: 64
Font Style: Bold
Alignment: Center
Position: Below icon
Color: White
```

### Add Reward Display

1. Right-click CompletionModal → **UI → Image** (coin icon)
2. Add **UI → Text - TextMeshPro** next to it

```
Coin Icon:
  Size: 80x80
  Image: Coin sprite or emoji (🪙)

Reward Text:
  Text: "+100 Coins"
  Font Size: 56
  Color: Gold (255, 215, 0, 255)
  Font Style: Bold
```

### Add Continue Button

```
Position: Bottom of modal
Size: 600x100
Button Color: Green (50, 200, 50, 255)
Text: "Start Playing!"
Font Size: 48
```

---

## Final Assembly

### 1. Hierarchy Structure

Final hierarchy should look like:

```
TutorialCanvas
├── OverlayBackground
├── SpotlightMask
├── InstructionPanel
│   ├── Shadow (optional)
│   └── InstructionText
├── HandPointer
├── SkipUI
│   ├── SkipHoldIndicator
│   │   ├── SkipText
│   │   └── SkipProgressBar
│   └── SkipConfirmationPanel
│       ├── ConfirmationText
│       ├── WarningText
│       ├── SkipConfirmButton
│       └── SkipCancelButton
└── CompletionModal
    ├── CelebrationIcon
    ├── CompletionMessageText
    ├── RewardCoinsText
    └── ContinueButton
```

### 2. Assign References

Select **TutorialCanvas**, find **TutorialUIController** component:

Drag and drop UI elements to corresponding fields:

```
Overlay Components:
  Overlay Canvas Group: TutorialCanvas → CanvasGroup
  Dim Background: OverlayBackground
  Spotlight Mask: SpotlightMask

Instruction Panel:
  Instruction Panel: InstructionPanel
  Instruction Text: InstructionText
  Instruction Canvas Group: InstructionPanel → CanvasGroup

Hand Pointer:
  Hand Pointer: HandPointer

Skip UI:
  Skip Hold Indicator: SkipHoldIndicator
  Skip Progress Bar: SkipProgressBar
  Skip Confirmation Panel: SkipConfirmationPanel
  Skip Confirm Button: SkipConfirmButton
  Skip Cancel Button: SkipCancelButton

Completion UI:
  Completion Modal: CompletionModal
  Reward Coins Text: RewardCoinsText
  Completion Message Text: CompletionMessageText
  Completion Continue Button: ContinueButton
```

### 3. Configure HandPointer

Select **HandPointer**, find **HandPointerAnimator** component:

```
Animation Settings:
  Tap Animation Duration: 0.3
  Tap Scale Multiplier: 0.8
  Idle Bounce Duration: 1.0
  Idle Bounce Amount: 10

Movement Settings:
  Movement Speed: 500

Visual Settings:
  Canvas Group: HandPointer → CanvasGroup
  Hand Image: HandPointer → Image
  Fade In Duration: 0.3
```

### 4. Create Prefab

1. Drag **TutorialCanvas** from Hierarchy to Project window
2. Save in `Prefabs/` folder as **TutorialCanvas.prefab**
3. Now you can instantiate this prefab in any scene

---

## Testing the UI

### In-Editor Test

1. Press Play in Unity Editor
2. Manually call: `TutorialManager.Instance.StartTutorial()`
3. Verify:
   - Overlay dims the screen ✓
   - Instruction text appears ✓
   - Hand pointer is visible ✓
   - Spotlight moves with targets ✓

### Visual Checklist

- [ ] All text is readable (not cut off)
- [ ] Hand pointer animates smoothly
- [ ] Spotlight is clearly visible
- [ ] Buttons respond to hover/press
- [ ] Modal centers correctly
- [ ] No overlap between UI elements
- [ ] Works at different resolutions (test 16:9, 18:9, 19.5:9)

---

## Mobile Testing Tips

### Resolution Testing

Test at common mobile resolutions:
- 1080x1920 (Full HD)
- 1080x2340 (19.5:9)
- 750x1334 (iPhone 8)
- 1125x2436 (iPhone X)

Change Game view resolution to test different aspect ratios.

### Safe Area

For notched devices, adjust top UI elements:

```csharp
void ApplySafeArea()
{
    Rect safeArea = Screen.safeArea;
    RectTransform rectTransform = GetComponent<RectTransform>();
    
    Vector2 anchorMin = safeArea.position;
    Vector2 anchorMax = anchorMin + safeArea.size;
    
    anchorMin.x /= Screen.width;
    anchorMin.y /= Screen.height;
    anchorMax.x /= Screen.width;
    anchorMax.y /= Screen.height;
    
    rectTransform.anchorMin = anchorMin;
    rectTransform.anchorMax = anchorMax;
}
```

---

## Common Issues

### Text is blurry
- Check Canvas Scaler settings
- Ensure TextMeshPro font has sufficient atlas resolution
- Enable "Extra Padding" in TextMeshPro font settings

### Hand pointer doesn't animate
- Verify HandPointerAnimator script is attached
- Check CanvasGroup alpha is 1
- Ensure GameObject is active

### Spotlight doesn't highlight correctly
- Check Camera.main is set
- Verify RectTransform anchors are correct
- Check Canvas Render Mode

### Buttons don't respond
- Verify Event System exists in scene
- Check Raycast Target is enabled on button Images
- Ensure no full-screen blocking elements are in front

---

## Next Steps

1. ✓ Create UI Prefabs (this guide)
2. → Integrate with game logic (see Integration Guide)
3. → Add analytics tracking
4. → Configure cloud save
5. → Test on device

See [TUTORIAL_INTEGRATION_GUIDE.md](TUTORIAL_INTEGRATION_GUIDE.md) for integration steps.

---

**End of UI Prefab Setup Guide**

