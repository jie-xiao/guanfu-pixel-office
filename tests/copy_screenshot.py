import shutil
src = r'C:\Users\Administrator\.openclaw\media\browser\bae31c43-b380-47ef-b794-abeec09b9e0e.png'
dst = r'C:\Users\Administrator\.openclaw\workspace\analyst\dept_panels.png'
shutil.copy2(src, dst)
print('Copied successfully')
