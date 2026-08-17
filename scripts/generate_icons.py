import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_zenri_logo(size=512):
    # Base dark canvas with subtle glowing background
    img = Image.new('RGBA', (size, size), (9, 13, 22, 255)) # #090D16
    draw = ImageDraw.Draw(img)
    
    # Add subtle background mesh dots
    dot_spacing = size // 24
    for x in range(0, size, dot_spacing):
        for y in range(0, size, dot_spacing):
            # Calculate distance to center
            dx = x - size / 2
            dy = y - size / 2
            dist = math.sqrt(dx*dx + dy*dy)
            alpha = int(max(0, 1.0 - dist / (size * 0.6)) * 40)
            if alpha > 0:
                draw.ellipse([x-1, y-1, x+1, y+1], fill=(0, 150, 255, alpha))

    # Add ambient central glow
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    center = size / 2
    glow_draw.ellipse([center - size*0.35, center - size*0.35, center + size*0.35, center + size*0.35], fill=(0, 102, 255, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.15))
    img.alpha_composite(glow)

    # Logo vector layer
    logo_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    l_draw = ImageDraw.Draw(logo_layer)

    scale = size / 512.0

    # Gradient colors
    # Top bar of Z: rounded rectangle
    bar_x1, bar_y1 = int(140 * scale), int(160 * scale)
    bar_x2, bar_y2 = int(320 * scale), int(220 * scale)
    bar_radius = int(30 * scale)

    # Main Z-arm & Diagonal Pill
    # Draw top pill
    l_draw.rounded_rectangle([bar_x1, bar_y1, bar_x2, bar_y2], radius=bar_radius, fill=(0, 180, 255, 255))
    
    # Diagonal leg of Z
    diag_poly = [
        (int(320 * scale), int(160 * scale)),
        (int(200 * scale), int(350 * scale)),
        (int(140 * scale), int(350 * scale)),
        (int(260 * scale), int(160 * scale)),
    ]
    l_draw.polygon(diag_poly, fill=(0, 120, 255, 255))

    # Bottom left rounded cap
    l_draw.ellipse([int(140 * scale), int(320 * scale), int(200 * scale), int(380 * scale)], fill=(0, 100, 255, 255))

    # Separate Glowing Dot on right
    dot_cx, dot_cy = int(330 * scale), int(330 * scale)
    dot_r = int(32 * scale)
    l_draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=(0, 190, 255, 255))

    # Combine logo with image
    img.alpha_composite(logo_layer)

    return img

if __name__ == '__main__':
    public_dir = r'c:\Users\Surface PC\OneDrive\Desktop\ZenRI\public'
    os.makedirs(public_dir, exist_ok=True)

    # 1. 512x512 PWA Icon & Apple Touch Icon
    icon_512 = create_zenri_logo(512)
    icon_512.save(os.path.join(public_dir, 'icon-512.png'))
    icon_512.save(os.path.join(public_dir, 'apple-touch-icon.png'))

    # 2. 192x192 PWA Icon
    icon_192 = create_zenri_logo(192)
    icon_192.save(os.path.join(public_dir, 'icon-192.png'))

    # 3. Favicon PNG & ICO
    favicon = create_zenri_logo(64)
    favicon.save(os.path.join(public_dir, 'favicon.png'))
    favicon.save(os.path.join(public_dir, 'favicon.ico'))

    print('Successfully generated all icon assets in public directory!')
