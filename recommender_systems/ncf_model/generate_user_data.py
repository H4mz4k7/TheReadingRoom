#Fill the user Database with users (relating to the user_ids in the ratings.csv files)
import bcrypt
import pandas as pd

# Settings
total_users = 959
password_plain = "password123"
csv_filename = "./csv_files/users.csv"

# Hash the password
password_encoded = password_plain.encode()
hashed_password = bcrypt.hashpw(password_encoded, bcrypt.gensalt()).decode()

# Generate user data
data = {
    'email': [f'user{i}@example.com' for i in range(1, total_users + 1)],
    'username': [f'user{i}' for i in range(1, total_users + 1)],
    'password': [hashed_password for _ in range(total_users)],
    'user_id': list(range(1, total_users + 1))
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to CSV
df.to_csv(csv_filename, index=False)

