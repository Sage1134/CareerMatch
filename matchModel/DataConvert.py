import pandas as pd

csv_file_path = 'matchModel/jobPostings.csv'
selected_column = 'description'


df = pd.read_csv(csv_file_path, usecols=[selected_column])
df[selected_column] = df[selected_column].replace('\n', ' ', regex=True)

json_data = df.to_json(orient='records')

json_file_path = 'Data.json'
with open(json_file_path, 'w') as json_file:
    json_file.write(json_data)
