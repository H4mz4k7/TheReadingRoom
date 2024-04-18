import sys
import pandas as pd
import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt




def getData():
    ratings = pd.read_csv('../books_data/ratings_new.csv')
    books = pd.read_csv('../books_data/books_new.csv')


    english_codes = ['en', 'en-CA', 'en-GB', 'en-US', 'eng']
    books = books[books['language_code'].isin(english_codes)]


    books_df= pd.merge(books, ratings, on='book_id')


    columns_to_keep = ['user_id', 'book_id', 'authors', 'title', 'rating']
    books_df = books_df[columns_to_keep]


    filtered_book_df = books_df.copy()


    user_count = filtered_book_df['user_id'].value_counts()
    filtered_book_df = filtered_book_df[filtered_book_df['user_id'].isin(user_count[user_count >= 160].index)]

    books_count = filtered_book_df['book_id'].value_counts()
    filtered_book_df = filtered_book_df[filtered_book_df['book_id'].isin(books_count[books_count >= 15].index)]


    return filtered_book_df

    

