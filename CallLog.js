function Log(id){
  var self = this;
  self.id =  ko.observable(id);
  self.title = ko.observable('');
  self.date = ko.observable("2000-01-01");
  self.firstName = ko.observable('');
  self.lastName = ko.observable('');
  self.phone = ko.observable('');
  self.status = ko.observable('In Progress');
  self.assignee = ko.observable(0);
  self.category = ko.observable('Open');
  self.description = ko.observable('');
  self.resolution = ko.observable('');

}

function Log(id, title, date, first, last, phone, status, assignee, category, description, resolution){
  var self = this;
  self.id = ko.observable(id);
  self.title = ko.observable(title);
  self.date = ko.observable(date);
  self.firstName = ko.observable(first);
  self.lastName = ko.observable(last);
  self.phone = ko.observable(phone);
  self.status = ko.observable(status);
  self.assignee = ko.observable(assignee);
  self.category = ko.observable(category);
  self.description = ko.observable(description);
  self.resolution = ko.observable(resolution);
}

function LoadLog(log){
  var self = this;
  self.id = ko.observable(log.id);
  self.title = ko.observable(log.title);
  self.date = ko.observable(log.date);
  self.firstName = ko.observable(log.firstName);
  self.lastName = ko.observable(log.lastName);
  self.phone = ko.observable(log.phone);
  self.status = ko.observable(log.status);
  self.assignee = ko.observable(log.assignee.empID);
  self.category = ko.observable(log.category);
  self.description = ko.observable(log.description);
  self.resolution = ko.observable(log.resolution);
}

function LoadLogs(logs){
  var outLogs = [];
  for (var i = 0; i < logs.length; i++) {
    outLogs.push(new LoadLog(logs[i]));
  };
  return outLogs;
}

function Assignee(){
  var self = this;

  self.empID = ko.observable(0);
  self.firstName = ko.observable("");
  self.lastName = ko.observable("");
  self.email = ko.observable("");
}

function Assignee(empID,firstName,lastName,email){
  var self = this;

  self.empID = ko.observable(empID);
  self.firstName = ko.observable(firstName);
  self.lastName = ko.observable(lastName);
  self.email = ko.observable(email);
}

function LoadAssignee(assignee){
  var self = this;

  self.empID = ko.observable(assignee.empID);
  self.firstName = ko.observable(assignee.firstName);
  self.lastName = ko.observable(assignee.lastName);
  self.email = ko.observable(assignee.email);
}

function LoadAssignees(newAssignees){
  var assignees = [];
  for (var i = 0; i < newAssignees.length; i++) {
    assignees.push(new LoadAssignee(newAssignees[i]));
  };
  return assignees;
}

function CallLogViewModel() {
  var self = this;
  self.search = ko.observable("");
  self.logForm = ko.observable(false);
  self.logHistory = ko.observable(true);
  self.logs = ko.observableArray([]);
  self.filtered = ko.observableArray([]);
  self.assignees = ko.observableArray([]);
  self.localStorage = false;
  self.status = ko.observableArray([
    "Open",
    "On hold",
    "Completed",
    "Cancelled"
  ]);
  self.category = ko.observableArray([
    "Login issue",
    "Software request",
    "Hardware request"
  ]);
  self.description = ko.observable('');


  self.GetNextID = function () {
    if (self.logs().length > 0) {
      var sortedArray = self.logs().sort(function(l, r){ l.id() > r.id()})
      return sortedArray[sortedArray.length - 1].id() + 1;
    }
    else {
      return 1;
    }
  };

  self.log = ko.observable(new Log(self.GetNextID()));

  self.Filter = ko.computed(function () {
    var filtered = [];
    var s = self.search();
    if(s.length > 0){
      for (var i = 0; i < self.logs().length; i++) {
        var log = self.logs()[i];
        if (log.id().toString().toLowerCase().indexOf(s.toLowerCase()) > -1
            || log.title().toLowerCase().indexOf(s.toLowerCase()) > -1
            || log.firstName().toLowerCase().indexOf(s.toLowerCase()) > -1
            || log.lastName().toLowerCase().indexOf(s.toLowerCase()) > -1
            || log.phone().toLowerCase().indexOf(s.toLowerCase()) > -1
            || log.status().toLowerCase().indexOf(s.toLowerCase()) > -1){
          filtered.push(log)
        }
      }
      self.filtered(filtered);
    }
    else {
      self.filtered(self.logs());
    }

  });

  self.AddLog = function (){
    self.log(new Log(self.GetNextID()));
    self.logForm(true);
    self.logHistory(false);
    self.new = true;
  };

  self.CancelLog = function () {
    self.logForm(false);
    self.logHistory(true);
  };

  self.EditLog = function(logToEdit){
    self.log(logToEdit);
    self.logForm(true);
    self.logHistory(false);
    self.new = false;
    self.SaveToLocalStorage();
  };

  self.SaveLog = function (){
    if (self.new === true) {
      self.logs.push(self.log());
    }
    self.logForm(false);
    self.logHistory(true);
    self.SaveToLocalStorage();
  };

  self.SaveToLocalStorage = function() {
    localStorage.callLogApp = true;
    localStorage.logs = ko.toJSON(self.logs);
    localStorage.assignees = ko.toJSON(self.assignees);
    localStorage.category = ko.toJSON(self.category);
  };

  self.LoadFromLocalStorage = function () {
    var logs = JSON.parse(localStorage.logs);
    var assignees = JSON.parse(localStorage.assignees);
    var category = JSON.parse(localStorage.category);
    self.logs(LoadLogs(logs));
    self.assignees(LoadAssignees(assignees));
    self.category(category);
  };

  self.Init = function(){
    if(self.localStorage){
      self.SaveToLocalStorage();
    }
    self.Filter();
  };
}

var callLogViewModel = new CallLogViewModel();


function SeedData(vm){
  vm.logs([
    new Log(1, "Account locked", "2016-02-10", "Jordan", "Castillo", "316-708-0215", "Open", 1, "Login Issue", "Account locked, too many password attempts.",""),
    new Log(2, "Forgot password", "2016-02-10", "John", "Smith","555-555-5555", "Completed", 0, "Login Issue", "Forgotten password.", "Sent a temporary password, reset account."),
    new Log(3, "Need office installed", "2016-02-09", "Samantha", "Clark", "555-555-5555", "On hold", 0, "Software Request", "Requesting Microsoft Office license. Put on hold, waiting on approval.", "")
  ]);
  vm.assignees([
    new Assignee(0,"Unassigned","",""),
    new Assignee(1, "Jane", "Doe", "jane.doe@sunoco.com")
  ]);
  vm.category(["Login issue", "Software request", "Hardware request"]);
}

//seed test data if storage is empty
if(typeof(Storage) === "undefined") {
  callLogViewModel.localStorage = false;
  SeedData(callLogViewModel);
}
else{
  callLogViewModel.localStorage = true;
  if (typeof(localStorage.callLogApp) === "undefined") {
    SeedData(callLogViewModel);
  }
  else{
    callLogViewModel.LoadFromLocalStorage();
  }
}

callLogViewModel.Init();
ko.applyBindings(callLogViewModel);
