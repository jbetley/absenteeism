############################################
# State and District Information Dashboard #
# main application & backend               #
############################################
# author:   jbetley (https://github.com/jbetley)
# version:  1.05  # noqa: ERA001
# date:     10/19/26

import os

import bcrypt
from dotenv import load_dotenv
from flask import Flask, render_template, request, session

from load_data import (
    get_all_district_data,
    get_analysis_data,
    get_attend_msg,
    get_attendance_data,
    get_single_district_data,
    get_state_data,
    get_state_dropdown_academic,
    get_state_dropdown_funding,
)

application = Flask(__name__, static_folder="./modules")

load_dotenv()
application.secret_key = os.environ.get('SECRET_KEY')
PASSWORD_HASH = os.environ.get('PASSWORD_HASH')

def check_auth(password):
    """Checks if the provided password matches the stored hash."""
    return bcrypt.checkpw(password.encode('utf-8'), PASSWORD_HASH.encode('utf-8'))


@application.route('/form_login', methods=['POST', 'GET'])
def login():
    usr = ""
    pwd = request.form['password']
    
    if not pwd or not check_auth(pwd):
        if 'first_load' not in session:
            session['first_load'] = True
            return render_template('login.html')
        else:
            return render_template('login.html', info='Invalid Password.')
    else:
        return render_template('index.html', name=usr)

 
@application.route("/")
def index():
    return render_template("login.html")


# school dropdown list (funding)
@application.route("/load_funding", methods=["GET"])
def load_state_dropdown_funding():

    state_df = get_state_dropdown_funding()

    # convert NaN to "" otherwise the field gets dropped
    # when serialized
    state_df = state_df.fillna("")
    
    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in state_df.to_dict(orient="records")
    ]

# school dropdown list (academic)
@application.route("/load_academic", methods=["GET"])
def load_state_dropdown_academic():

    state_df = get_state_dropdown_academic()

    state_df = state_df.fillna("")

    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in state_df.to_dict(orient="records")
    ]
    

# attendance messages
@application.route("/attend_msg", methods=["GET"])
def load_attend_msg():

    msg_data = get_attend_msg()

    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in msg_data.to_dict(orient="records")
    ]
    
@application.route("/districts", methods=["post"])
def load_all_district_data():
    
    data = request.get_json()
    district_data = get_all_district_data(data)
    
    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in district_data.to_dict(orient="records")
    ]


@application.route("/attendance", methods=["post"])
def load_attendance_data():
    
    data = request.get_json()
    attendance_data = get_attendance_data(data)
    
    # drop rows where both values are nan
    attendance_data = attendance_data.dropna(
        subset=["Attendance Rate", "Chronic Absenteeism"], how='all'
    )

    # need this to retain columns with empty values
    attendance_data = attendance_data.fillna("")

    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in attendance_data.to_dict(orient="records")
    ]


@application.route("/analysis", methods=["post"])
def load_analysis_data():
    
    data = request.get_json()
    analysis_data = get_analysis_data(data)
    
    # need this to retain columns with empty values
    analysis_data = analysis_data.fillna("")

    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in analysis_data.to_dict(orient="records")
    ]
    
    
@application.route("/district", methods=["post"])
def load_single_district_data():
    
    selections = request.get_json()

    district_data = get_single_district_data(selections)

# TODO: Fix THIS ADN TEST CHANGE TO IDS RATHER THAN NAMES
# FutureWarning: Downcasting object dtype arrays on .fillna, .ffill, .bfill is deprecated and
# will change in a future version. Call result.infer_objects(copy=False) instead. To opt-in to
# the future behavior, set `pd.set_option('future.no_silent_downcasting', True)`
    district_data["Number Charter Schools"] = \
        district_data["Number Charter Schools"].fillna(0)
    
    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in district_data.to_dict(orient="records")
    ]


@application.route("/states", methods=["post"])
def load_state_data():

    data = request.get_json()

    state_data = get_state_data(data)

    # NOTE: For some reason the district_data conversion causes this
    # dataset to drop some records (with same First name)
    return state_data.to_dict('records')


@application.route("/download", methods=["post"])
def download():
    # data is in format [SchoolID, PageType]
    data = request.get_json()

    school_id = data[0]
    page_type = data[1]
    
    if page_type == "funding":
        return_data = get_all_district_data(school_id)
    elif page_type == "attend":
        return_data = get_attendance_data(school_id)
    else:
        return {}
        
    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in return_data.to_dict(orient="records")
    ]


if __name__ == "__main__":
    application.run(host="127.0.0.1", port="8001")

# if __name__ == "__main__":
#     application.run(host="0.0.0.0", port=4000, debug=True)  # noqa: S104, S201
    