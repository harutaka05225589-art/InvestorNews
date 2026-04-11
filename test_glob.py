import sqlite3
c = sqlite3.connect(':memory:')
c.execute('create table test(t text)')
c.execute("insert into test (t) values ('130A'), ('1234')")
print(c.execute("select t from test where t GLOB '*[a-zA-Z]*'").fetchall())
print(c.execute("select t from test where t GLOB '*[A-Za-z]*'").fetchall())
