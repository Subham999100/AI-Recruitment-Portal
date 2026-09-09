from Backend.database import get_db_connection


connection = get_db_connection()

cursor = connection.cursor()

cursor.execute("SELECT version();")

result = cursor.fetchone()

print("PostgreSQL connection successful!")
print(result[0])

cursor.close()
connection.close()