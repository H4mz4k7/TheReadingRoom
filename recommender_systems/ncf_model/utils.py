import pandas as pd
import tensorflow as tf
tf.get_logger().setLevel('ERROR') # only show error messages
from recommenders.models.ncf.dataset import Dataset as NCFDataset
from pymongo import MongoClient



    
    

def sort_ratings(filtered_book_df,id):
    unique_userIds = filtered_book_df[id].unique()
    unique_userIds.sort()

    # Create a mapping from old userIds to new ones (starting from 1)
    user_id_mapping = {old_id: new_id for new_id, old_id in enumerate(unique_userIds, start=1)}

    # Apply the mapping to the userIds column
    filtered_book_df[id] = filtered_book_df[id].map(user_id_mapping)

    return filtered_book_df


def get_ratings_from_db():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['database']
    collection = db['ratings']

    # Fetch data
    data = collection.find({}, {'_id': 0})

    # Convert to DataFrame
    df = pd.DataFrame(list(data))

    # Save to CSV
    df = sort_ratings(df, 'book_id')
    df = sort_ratings(df, 'user_id')
    df = df.sort_values(by='user_id', ascending=True)

    
    ratings_file = "./csv_files/ratings.csv"
    df.to_csv(ratings_file, index=False)

    return df


def get_ratings_from_files():
    
    ratings = pd.read_csv('../books_data/ratings_new.csv')
    books = pd.read_csv('../books_data/books_new.csv')


    english_codes = ['en', 'en-CA', 'en-GB', 'en-US', 'eng']
    books = books[books['language_code'].isin(english_codes)]


    books_df= pd.merge(books, ratings, on='book_id')


    columns_to_keep = ['user_id', 'book_id','rating']
    books_df = books_df[columns_to_keep]


    filtered_book_df = books_df.copy()


    user_count = filtered_book_df['user_id'].value_counts()
    filtered_book_df = filtered_book_df[filtered_book_df['user_id'].isin(user_count[user_count >= 160].index)]

    books_count = filtered_book_df['book_id'].value_counts()
    filtered_book_df = filtered_book_df[filtered_book_df['book_id'].isin(books_count[books_count >= 15].index)]

    filtered_book_df = sort_ratings(filtered_book_df, 'book_id')
    filtered_book_df = sort_ratings(filtered_book_df, 'user_id')
    filtered_book_df = filtered_book_df.sort_values(by='user_id', ascending=True)

    
    ratings_file = "./csv_files/ratings.csv"
    filtered_book_df.to_csv(ratings_file, index=False)

    return filtered_book_df


def get_NCF_dataset(train_file):
    return NCFDataset(train_file=train_file, seed=42, col_item="book_id", col_user="user_id")


def keep_first_author(books_csv):
    df = pd.read_csv(books_csv)
    
    # Keep only the first author from the 'authors' column
    df['authors'] = df['authors'].apply(lambda x: x.split(',')[0].strip())

    df.rename(columns={'authors': 'author'}, inplace=True)

    # Save the updated DataFrame to the same CSV file
    df.to_csv(books_csv, index=False)
    print("CSV updated and saved.")

    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['database']
    collection = db['books']

    # Drop the existing collection if it exists
    db.drop_collection('books')
    print(f"Dropped existing collection '{'books'}'.")

    # Load the DataFrame into MongoDB
    data = df.to_dict('records')  # Convert DataFrame to dictionary format
    collection.insert_many(data)
    print(f"Data loaded into MongoDB collection '{'books'}' successfully.")


