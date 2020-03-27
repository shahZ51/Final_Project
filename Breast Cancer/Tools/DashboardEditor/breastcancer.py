import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

def predict(params):
    # Reading data
    final_data = pd.read_csv('./static/data/final_data.csv')

    # Assign X (data) and y (target)
    X = final_data[["concave points_mean", "area_mean", "area_se"]]
    y = final_data["diagnosis"]

    # Split test and train datasets
    X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=1, stratify=y, test_size=0.40)

    # Develop logistic regression
    classifier = LogisticRegression()

    classifier.fit(X_train, y_train)

    #predictions = classifier.predict(X_test)

    # load the model from disk
    #filename = 'finalized_model.sav'    
    #loaded_model = joblib.load(filename)
    #result = classifier.score(X_test, y_test)
    #params['concave_pts_mean'], params['area_mean'], params['area_se']
    
    new_concave_point_value = float(params['concave_pts_mean'])
    new_area_value  = float(params['area_mean'])
    new_area_sevalue = float(params['area_se'])

    new_breastcancer_data = [[new_concave_point_value,new_area_value,new_area_sevalue]]

    predicted_class = classifier.predict(new_breastcancer_data)
    result = predicted_class[0]

    # Return results
    return result
