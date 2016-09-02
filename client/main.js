import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { modules, events } from '/imports/Collections';
import Chance from 'chance';
const chance = new Chance();

import './main.html';

let allModules = modules.find(
	{},
	{
		fields: {_id: 1},
		transform(module) {
			module.x = randomPosition();
			module.y = randomPosition();
			return module
		}
	}
);

let allEvents = events.find({date: {$gte: new Date()}});

Template.graph.onCreated(function() {
	this.selection = new ReactiveVar(null);
});

Template.graph.helpers({
	selectedModule() {
		const selection = Template.instance().selection.get();
		if (selection != null){
			return modules.findOne(selection)
		}
	},
	allModules,
	allEvents,
	setSelection() {
		let template = Template.instance();
		return module => template.selection.set(module._id)
	},
	clearSelection() {
		let template = Template.instance();
		return () => template.selection.set(null)
	},
	sendEvent() {
		return module => events.insert({senderId: module._id, date: new Date()});
	}
});

Template.graph.events({
	'click .js-add'() {
		modules.insert({name: chance.name({nationality: 'it'})})
	},
	'click .js-remove'() {
		if (modules.find().count()>0)
			modules.remove(modules.findOne()._id)
	}
});

function randomPosition() { return 200 + Math.floor(Math.random()*101) }