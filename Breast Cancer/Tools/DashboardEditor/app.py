import pandas as pd
import datetime 
from flask import Flask, redirect, render_template, jsonify, request
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy import *
import uuid
import json
import breastcancer

app = Flask(__name__)

connection_string = "postgres:root123@localhost:5432/tie_db"
engine = create_engine(f'postgresql://{connection_string}')


class Base(object):
    def to_dict(self):
        json_exclude = getattr(self, '__json_exclude__', set())
        return {key: value for key, value in self.__dict__.items()
                # Do not serialize 'private' attributes
                # (SQLAlchemy-internal attributes are among those, too)
                if not key.startswith('_')
                and key not in json_exclude
                } 

Base = declarative_base(cls=Base)

class TieItem(Base):
    __tablename__ = 'items'
    id   = Column(Integer, primary_key=True)
    refid = Column(UUID(as_uuid=True),primary_key=False,default=uuid.uuid4)
    type  = Column(String, nullable=False)
    name  = Column(String)
    created_date = Column(DateTime)
    updated_date = Column(DateTime)
    is_deleted = Column(Boolean)
    is_published = Column(Boolean) 
    content = Column(JSON)
    
#Base.metadata.create_all(bind=engine)    
#session = Session(engine)

@app.route("/")
def index():    
    #return render_template("index.html")
    return redirect('/dashsearch')

@app.route("/dashsearch")
def search_dashboard():
    session = Session(engine)    
    searchkey = request.args.get('searchkey', '')
    lst_tieitem = []
    if searchkey == '':
        lst_tieitem = session.query(TieItem).order_by(TieItem.updated_date.desc()).limit(20).all()
    else:
        lst_tieitem = session.query(TieItem).filter(TieItem.name.ilike(f'%{searchkey}%')).order_by(TieItem.updated_date.desc()).limit(10).all()
    return render_template("dashsearch.html", lst_tieitem = lst_tieitem)

@app.route("/dashedit")
def edit_dashboard():
    refid = request.args.get('refid', '')
    return render_template("dashedit.html", refid = refid)

@app.route("/dashview")
def view_dashboard():
    refid = request.args.get('refid', '')
    return render_template("dashview.html", refid = refid)


@app.route("/api/v1/dashboard/addnew", methods=['GET'])
def addnew_dashboard():
    session = Session(engine)
    new_dashboard = TieItem(type="dashboard", name = "Untitled Dashboard"        
        , created_date=datetime.datetime.now()
        , updated_date = datetime.datetime.now()
        , is_deleted = False
        , is_published = False )

    session.add(new_dashboard)
    session.commit()
    #newId = #new_dashboard.id
    refid = {"refid":new_dashboard.refid}
    session.close()    
    #newItem = session.query(TieItem).filter(TieItem.id == newId).first()
    return jsonify(refid)

@app.route("/dashboard/save", methods=['POST'])
def save_dashboard():
#
    session = Session(engine)
    newItem = request.get_json()
    
    targetItem =  session.query(TieItem).filter(TieItem.id == newItem['id']).first()
    targetItem.updated_date = datetime.datetime.now()
    targetItem.name = newItem['name']
    targetItem.content = newItem['content'] 
    session.commit()
    session.close()

    return jsonify({"result":"OK"})
#

@app.route("/api/v1/dashboard/getitem", methods=['POST','GET'])
def getTieItem():
#
    session = Session(engine)
    params = request.get_json()
    item = session.query(TieItem).filter(TieItem.refid == params['refid']).first()
    
    return jsonify(item.to_dict())
#

@app.route("/dashboard/getchartdata", methods=['POST'])
def getChartData():
#
    chartParams = request.get_json()
    chart_type = chartParams['chart_type'].split(":")
    dataset_type = chartParams['chart_dataset']['dataset_type']
    dataset_path = chartParams['chart_dataset']['dataset_path']
    chart_cols = chartParams['chart_cols']
    chart_rows = chartParams['chart_rows']

    df = pd.DataFrame()
    df_chartdata = pd.DataFrame()
    json_result = {}

    if(dataset_type == 'CSV'):
        df = pd.read_csv(dataset_path)
    if(chart_type[0] == 'BARCHART') :
        if(chart_type[1] == 'VERTICAL'):
            gb_result = df.groupby(chart_cols)
            aggr = chart_rows[0].split(':')   #aggregate details(i.e. columns and aggregate function)
            aggr_col = aggr[0]
            aggr_func = aggr[1]
            if(aggr_func == 'SUM') :
                df_chartdata = pd.DataFrame(gb_result[aggr_col].sum())
                df_chartdata = df_chartdata.reset_index()
                df_chartdata.columns = ['x_value','y_value']
                json_result = df_chartdata.to_json(orient="records")
        elif(chart_type[1] == 'HORIZONTAL'):
            gb_result = df.groupby(chart_rows)
            aggr = chart_cols[0].split(':')   #aggregate details(i.e. columns and aggregate function)
            aggr_col = aggr[0]
            aggr_func = aggr[1]
            if(aggr_func == 'SUM') :
               df_chartdata = pd.DataFrame(gb_result[aggr_col].sum())
               df_chartdata = df_chartdata.reset_index()
               df_chartdata.columns = ['y_value','x_value']
               json_result = df_chartdata.to_json(orient="records")
  
    print(json_result)
    return json_result
#

#This is just an example function for form app
@app.route("/api/v1/breastcancer/predict", methods=['POST','GET'])
def getPrediction():
#
    params = request.get_json()
    print(f"concave_pts_mean = {params['concave_pts_mean']}")
    print(f"area_mean = {params['area_mean']}")
    print(f"area_se = {params['area_se']}")

    result = breastcancer.predict(params)
    json_result = {"result" : result }

    return json_result
#


if __name__ == "__main__":
    app.run(debug=True,use_reloader=False)
