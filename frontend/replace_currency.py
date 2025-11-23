import os
import re

def replace_currency_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace $ with ₹ (only when followed by a digit or space+digit)
        content = re.sub(r'\$(?=\s*\d)', '₹', content)
        
        # Replace USD with INR
        content = content.replace('USD', 'INR')
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    src_dir = r'd:\Externals\Company\My Start-Ups\Kaizenith Technologies Pvt Ltd\project\RayERP\frontend\src'
    
    updated_files = []
    
    for root, dirs, files in os.walk(src_dir):
        # Skip node_modules
        if 'node_modules' in root:
            continue
            
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                if replace_currency_in_file(filepath):
                    updated_files.append(filepath)
    
    print(f"Updated {len(updated_files)} files:")
    for f in updated_files[:10]:  # Show first 10
        print(f"  - {os.path.basename(f)}")
    if len(updated_files) > 10:
        print(f"  ... and {len(updated_files) - 10} more")

if __name__ == '__main__':
    main()
