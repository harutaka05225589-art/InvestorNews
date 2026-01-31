
import os
import stat
import pwd
import grp

start_dir = os.path.expanduser('~/InvestorNews')
print(f"Scanning {start_dir} for .db files...")

for root, dirs, files in os.walk(start_dir):
    # Skip huge dirs like node_modules to save time/output
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.next' in dirs:
        dirs.remove('.next')
    if '.git' in dirs:
        dirs.remove('.git')

    for file in files:
        if 'investor_news.db' in file:
            full_path = os.path.join(root, file)
            st = os.stat(full_path)
            try:
                user = pwd.getpwuid(st.st_uid).pw_name
                group = grp.getgrgid(st.st_gid).gr_name
            except:
                user = str(st.st_uid)
                group = str(st.st_gid)
            
            perms = oct(st.st_mode)[-3:]
            print(f"File: {full_path}")
            print(f"  Owner: {user}:{group} | Perms: {perms} | Size: {st.st_size}")
