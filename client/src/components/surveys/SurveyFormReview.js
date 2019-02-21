import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import formFields from "./formFields";
import * as actions from "../../actions";
import _ from "lodash";

// SurveyFormReview shows users their form inputs for review
const SurveyFormReview = ({ onCancel, formValues, sendSurvey, history }) => {
	
	const reviewFields = _.map(formFields, ({ name, label }) => {
		return (
			<div key={name}>
				<label>{label}</label>
				<div>
					{formValues[name]}
				</div>
			</div>
		);
	});

	return (
		<div>
			<h5>Please confirm your entries</h5>
			{reviewFields}
			<button className="yellow white-text darken-2 btn-flat" onClick={onCancel}>
				Back
			</button>
			<button className="green white-text btn-flat right" onClick={() => sendSurvey(formValues, history)}>
				Send
				<i className="material-icons right">email</i>
			</button>
		</div>
	);
};

function mapStateToProps(state) {
	return {
		formValues: state.form.surveyForm.values
	};
}

export default connect(mapStateToProps, actions)(withRouter(SurveyFormReview));