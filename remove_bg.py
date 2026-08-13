from PIL import Image
import sys

paths = [
    r'g:\D? 햚\ChamCong-Family\landing-page\public\broom-0.png',
    r'g:\D? 햚\ChamCong-Family\landing-page\public\broom-1.png',
    r'g:\D? 햚\ChamCong-Family\landing-page\public\broom-2.png',
    r'g:\D? 햚\ChamCong-Family\landing-page\public\broom-3.png'
]

for p in paths:
    try:
        img = Image.open(p).convert('RGBA')
        pixels = img.load()
        width, height = img.size
        
        # Start BFS from edges
        visited = set()
        queue = []
        
        # Add border pixels to queue
        for x in range(width):
            queue.append((x, 0))
            queue.append((x, height - 1))
        for y in range(height):
            queue.append((0, y))
            queue.append((width - 1, y))
            
        bg_color = pixels[0, 0]
        
        def color_diff(c1, c2):
            return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))
            
        while queue:
            x, y = queue.pop(0)
            if (x, y) in visited:
                continue
            visited.add((x, y))
            
            current_color = pixels[x, y]
            if color_diff(current_color, bg_color) < 40: # tolerance
                pixels[x, y] = (255, 255, 255, 0)
                
                # add neighbors
                for dx, dy in [(1,0), (-1,0), (0,1), (0,-1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                        queue.append((nx, ny))
                        
        img.save(p, 'PNG')
        print(f"Processed {p}")
    except Exception as e:
        print(f"Error on {p}: {e}")
