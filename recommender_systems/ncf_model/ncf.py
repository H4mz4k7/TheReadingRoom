import pandas as pd
import tensorflow as tf
import utils
tf.get_logger().setLevel('ERROR') # only show error messages
from recommenders.datasets.python_splitters import python_stratified_split
from recommenders.models.ncf.ncf_singlenode import NCF
from recommenders.models.ncf.dataset import Dataset as NCFDataset
from recommenders.evaluation.python_evaluation import (
    ndcg_at_k, precision_at_k, recall_at_k
)
from recommenders.utils.constants import SEED 
from pymongo import MongoClient


client = MongoClient('mongodb://localhost:27017/')
db = client['database']  
collection = db['predictions'] 


# top k items to recommend
TOP_K = 10

# Model parameters
EPOCHS = 100
BATCH_SIZE = 32
LEARNING_RATE = 0.0005778618758548964



if __name__ == '__main__':
    ratings_df = utils.get_ratings_from_db()

    train, test = python_stratified_split(ratings_df, col_user="user_id", col_item="book_id")


    test = test[test["user_id"].isin(train["user_id"].unique())]
    test = test[test["book_id"].isin(train["book_id"].unique())]


    train_file = "./csv_files/train.csv"
    test_file = "./csv_files/test.csv"
    train.to_csv(train_file, index=False)
    test.to_csv(test_file, index=False)

    data = NCFDataset(train_file=train_file, seed=SEED, col_item="book_id", col_user="user_id")

    model = NCF(
        n_users=data.n_users, 
        n_items=data.n_items,
        model_type="NeuMF",
        n_factors=20,
        layer_sizes=[16,8,4],
        n_epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        verbose=10,
        seed=SEED
    )

    model.fit(data)
    model.save(dir_name="saved/NCF")


    users, items, preds = [], [], []
    item = list(train.book_id.unique())
    for user in train.user_id.unique():
        user = [user] * len(item) 
        users.extend(user)
        items.extend(item)
        preds.extend(list(model.predict(user, item, is_list=True)))

    all_predictions = pd.DataFrame(data={"user_id": users, "book_id":items, "prediction":preds})

    merged = pd.merge(train, all_predictions, on=["user_id", "book_id"], how="outer")
    all_predictions = merged[merged.rating.isnull()].drop('rating', axis=1)

    predictions_file = "./csv_files/predictions.csv"
    all_predictions.to_csv(predictions_file, index = False)


    records = all_predictions.to_dict('records')
    # Insert records into MongoDB
    collection.delete_many({})
    collection.insert_many(records)
    
    eval_ndcg = ndcg_at_k(test, all_predictions, col_prediction='prediction', col_item="book_id", col_user="user_id", k=TOP_K)
    eval_precision = precision_at_k(test, all_predictions, col_prediction='prediction',  col_item="book_id", col_user="user_id", k=TOP_K)
    eval_recall = recall_at_k(test, all_predictions, col_prediction='prediction',  col_item="book_id", col_user="user_id", k=TOP_K)

    print(
        "NDCG:\t%f" % eval_ndcg,
        "Precision@K:\t%f" % eval_precision,
        "Recall@K:\t%f" % eval_recall, sep='\n')



