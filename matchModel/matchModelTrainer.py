import gensim
import pandas as pd

df = pd.read_json("matchModel/Data.json")
df["description"] = df["description"].fillna("")


review_text = df["description"].apply(gensim.utils.simple_preprocess)

model = gensim.models.Word2Vec(
    window=10,
    min_count=2,
    workers=4,
)

model.build_vocab(review_text, progress_per=1000)
model.train(review_text, total_examples=model.corpus_count, epochs=model.epochs)

model.save("matchModel.model")