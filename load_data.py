############################################
# State and District Information Dashboard #
# Database Queries (SQLite)                #
############################################
# author:   jbetley (https://github.com/jbetley)
# version:  1.05  # noqa: ERA001
# date:     10/19/26

import heapq

import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///data/statedata.db")

print("Database Engine Created . . .")  # noqa: T201


def run_query(q, *args):
    """
    Takes sql text query, gets query as a dataframe (read_sql is a convenience function
    wrapper around read_sql_query), and perform a variety of basic clean up functions
    If no data matches the query, an empty df is returned

    Args:
        q (string): a sqlalchemy "text" query
        args (dict): a dict of query parameters
    Returns:
        pd.DataFrame: pandas dataframe of the query results
    """
    conditions = None

    with engine.connect() as conn:
        if args:
            conditions = args[0]

        df = pd.read_sql_query(q, conn, params=conditions)

        # sqlite column headers do not have spaces between words. But we need to
        # display the column names, so we have to do a bunch of str.replace to
        # account for all conditions. May be a better way, but this is pretty fast.
        # Adding a space between any lowercase character and any uppercase/number
        # character takes care of most of it. The other replace functions catch
        # edge cases.
        df.columns = df.columns.str.replace(r"([a-z])([A-Z1-9%])", r"\1 \2", regex=True)
        df.columns = df.columns.str.replace(r"([SA])([PEDI])", r"\1 \2", regex=True)
        df.columns = df.columns.str.replace(r"([1-9])([A-Z])", r"\1 \2", regex=True)

        # pesky Title Allocation strings
        df.columns = df.columns.str.replace("IA", "I A", regex=False)
        df.columns = df.columns.str.replace("IS", "I S", regex=False)
        df.columns = df.columns.str.replace("IVA", "IV A", regex=False)
       
        df.columns = df.columns.astype(str)
        
        return df

# NOTE: There are charter schools in the attendance file that are not
# considered districts for purposes of Title Funding- that is, they
# don't appear in the districts table. So we need to "switch" the
# district list when we are on attendance tab.
# old: SELECT StateAbbreviation, StateFull, EntityID, DistrictName, TitleI
def get_state_dropdown_funding():
    params = {"id": ""}
    q = text(
        """
        SELECT StateAbbreviation, StateFull, EntityID, DistrictName
            FROM district_info
        """,
    )
    result = run_query(q, params)

    result["Entity ID"] = result["Entity ID"].astype(str)

    return result

def get_attend_msg():
    
    params = { "state": ""}

    q = text(
        """
        SELECT StateAbbreviation, AttendanceNote, AbsenteeismNote
            FROM states
        """,
    )
    
    result = run_query(q, params)
    
    return result

def get_state_dropdown_academic():
    
    params = {
        "state": "",
        "district": ""
    }
    
    q = text(
        """
        SELECT Year, StateAbbreviation, EntityID, DistrictName, AttendanceRate
            FROM district_attendance
        """,
    )
        
    result = run_query(q, params)

    result["Entity ID"] = result["Entity ID"].astype(str)

    # we want to display the list of schools for the most
    # recent year. It is possible that a few states will
    # have more recent data, but we don't want a list of
    # just a few states, so we get the Years that make
    # up at least 10% of the rows (actual percentage should
    # be 100% / total number of years)
    value_counts = result["Year"].value_counts(normalize=True)
    frequent_values = value_counts[value_counts > 0.1]
    max_val = frequent_values.index.max()

    filtered = result[result["Year"] == max_val]
    
    return filtered


def get_all_district_data(data):
    
    # if this is called by download to excel, 'data' will be a
    # string equal to the state abbreviation
    if type(data) is list:
        params = {
            "state": data[0],
            "district": data[1]
        }
    else:
        params = {
            "state": data,
            "district": '0'
        }
        
    if params['district'] == '0':
        q = text(
            """
            SELECT *
                FROM district_info
                WHERE StateAbbreviation = :state
            """,
        )

    else:
        q = text(
            """
            SELECT *
                FROM district_info
                WHERE StateAbbreviation = :state AND EntityID = :district
            """,
        )
        
    district_data = run_query(q, params)

    # get funding data to add to district_info_data
    q2 = text(
        """
        SELECT *
            FROM district_finance
            WHERE StateAbbreviation = :state
        """,
    )

    raw_finance_data = run_query(q2, params)
    
    if not raw_finance_data.empty:

        raw_finance_data['Value'] = raw_finance_data['Value'].apply(pd.to_numeric, errors='coerce')
        
        district_finance_data = raw_finance_data.pivot_table(
            index=['Fund Year', 'Entity ID','Name'], 
            columns='Category', 
            values='Value', 
        ).reset_index()

        exclude_set = {"Entity ID", "Name","Fund Year"}
        clean_col_list = [col for col in district_finance_data.columns if col not in exclude_set]
        
        district_finance_data[clean_col_list] = district_finance_data[clean_col_list].apply(pd.to_numeric, errors='coerce')
         
        # Apply Fnd_ prefix to specific columns
        district_finance_data = district_finance_data.rename(columns=lambda x: f'Fnd_{x}' if x in clean_col_list else x)

        # Need this to drop schools with no finance data from fund page
        tagged_col_list = [col for col in district_finance_data.columns if col not in exclude_set]
        
        merged_data = pd.merge(
            district_data, district_finance_data, on='Entity ID', how='left')
        
        merged_data.dropna(subset=tagged_col_list, how='all', inplace=True)
        
        # after merging, find the name of the funding column that contains
        # the absolute max value and sort by that column
        # max_value = merged_data[tagged_col_list].max().max()
        max_column = merged_data[tagged_col_list].max().idxmax()

        merged_data = merged_data.sort_values(by=max_column, ascending=False)
        
    else:
        merged_data = district_data.copy()
        
    # merged_data.to_csv('merged_tmp.csv', index=False) #NOTE: Test
    # district_finance_data.to_csv('test-finance_data.csv', index=False) #NOTE: Test
    # district_data.to_csv('test-district_data.csv', index=False) #NOTE: Test

    return merged_data.reset_index(drop=True)


def get_analysis_data(state_id):
    
    params = {"state_id": state_id}
    
    # attendance data
    q1 = text(
        """
        SELECT *
            FROM district_attendance
            WHERE StateAbbreviation = :state
        """,
    )

    raw_attendance_data = run_query(q1, params)
    
    # funding data
    q2 = text(
        """
        SELECT *
            FROM district_finance
            WHERE StateAbbreviation = :state
        """,
    )

    raw_finance_data = run_query(q2, params)

    raw_finance_data['Value'] = raw_finance_data['Value'].apply(pd.to_numeric, errors='coerce')
        
    district_finance_data = raw_finance_data.pivot_table(
        index=['Fund Year', 'Entity ID','Name'], 
        columns='Category', 
        values='Value', 
    ).reset_index()

    exclude_set = {"Entity ID", "Name","Fund Year"}
    clean_col_list = [col for col in district_finance_data.columns if col not in exclude_set]
    district_finance_data[clean_col_list] = district_finance_data[clean_col_list].apply(pd.to_numeric, errors='coerce')
        
    # merge the two
    merged_data = pd.merge(
        raw_attendance_data, district_finance_data, on='Entity ID', how='left'
    )

    # Apply Fnd_ prefix to specific columns and get list of prefixed cols
    district_finance_data = district_finance_data.rename(columns=lambda x: f'Fnd_{x}' if x in clean_col_list else x)
    tagged_col_list = [col for col in district_finance_data.columns if col not in exclude_set]
    merged_data.dropna(subset=tagged_col_list, how='all', inplace=True)
    
    # after merging, find the name of the funding column that contains
    # the absolute max value and sort by that column
    # max_column = merged_data[tagged_col_list].max().idxmax()
    # merged_data = merged_data.sort_values(by=max_column, ascending=False)
        
    # merged_data.to_csv('merged_tmp.csv', index=False) #NOTE: Test
    # district_finance_data.to_csv('test-finance_data.csv', index=False) #NOTE: Test
    # district_data.to_csv('test-district_data.csv', index=False) #NOTE: Test

    return merged_data.reset_index(drop=True)



# gets single district by matching districtID and stateabbrev (EntityIDs
# are not unique across the entire table)
def get_single_district_data(data):
    # data is in format [StateAbbreviation, EntityID]
    print('Getting Single')
    print(data)
    params = {
        "state": data[0],
        "district": data[1]
    }

    q = text(
        """
        SELECT *
            FROM district_info
            WHERE CAST(EntityID AS TEXT) = :district AND StateAbbreviation = :state
        """,
    )

    district_data = run_query(q, params)
    
    district_data["Entity ID"] = district_data["Entity ID"].astype(str)
        
    return district_data.reset_index(drop=True)


def get_attendance_data(data):

    # see get_all_district_data
    if type(data) is list:
        params = {
            "state": data[0],
            "district": data[1]
        }
    else:
        params = {
            "state": data,
            "district": '0'
        }
        
    if params['district'] == '0':
        
        q = text(
            """
            SELECT *
                FROM district_attendance
                WHERE StateAbbreviation = :state
            """,
        )
    else:
        q = text(
            """
            SELECT *
                FROM district_attendance
                WHERE StateAbbreviation = :state AND EntityID = :district
            """,
        )

    attendance_data = run_query(q, params)
    
    # remove all districts with an enrollment of 40 or less
    attendance_data = attendance_data[attendance_data["Enrollment"] > 40]
    
    attendance_data["Entity ID"] = attendance_data["Entity ID"].astype(str)
    attendance_data["Attendance Rate"] = attendance_data["Attendance Rate"].astype(float)
    attendance_data["Chronic Absenteeism"] = attendance_data["Chronic Absenteeism"].astype(float)
    
    return attendance_data.reset_index(drop=True)


def get_state_data(state_id):

    params = {"state_id": state_id}

    q = text(
        """
        SELECT *
            FROM states
            WHERE StateAbbreviation = :state_id
        """,
    )

    state_data = run_query(q, params)

    state_data = state_data.sort_values(by="2026 Title I Allocation", ascending=False)

    return state_data.reset_index(drop=True)
