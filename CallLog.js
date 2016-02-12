function Log(id, title, date, first, last, phone, status, assignee, category, description, resolution){
  var self = this;
  self.id = ko.observable(id);
  self.title = ko.observable(title).extend({ required: true});
  self.date = ko.observable(date).extend({ required: true});
  self.firstName = ko.observable(first).extend({
                                          required: true,
                                          pattern: {
                                            message: "Only letters, no numbers or symbols.",
                                            params: '^[a-zA-Z]+$'
                                          }
                                        });
  self.lastName = ko.observable(last).extend({
                                        required: true,
                                        pattern: {
                                          message: "Only letters, no numbers or symbols.",
                                          params: '^[a-zA-Z]+$'
                                        }
                                      });;
  self.phone = ko.observable(phone).extend({
                                        required: true,
                                        pattern: {
                                          message: "Phone must match ###-###-#### pattern.",
                                          params: '^\\d{3}-\\d{3}-\\d{4}$'
                                        }
                                      });
  self.status = ko.observable(status);
  self.assignee = ko.observable(assignee);
  self.category = ko.observable(category);
  self.description = ko.observable(description);
  self.resolution = ko.observable(resolution);
}

function EmptyLog(id){
  return new Log(id, '', "2000-01-01", '' , '', '', 'In Progress', 0, 'Open', '', '');

}

function ParseLog(log){
  return new Log(log.id, log.title, log.date, log.firstName, log.lastName,
              log.phone, log.status, log.assignee, log.category, log.description, log.resolution);
}

function ParseLogs(logs){
  var outLogs = [];
  for (var i = 0; i < logs.length; i++) {
    outLogs.push(ParseLog(logs[i]));
  };
  return outLogs;
}

function Assignee(empID,firstName,lastName,email){
  var self = this;
  self.empID = ko.observable(empID).extend({
                                        required: true,
                                        pattern: {
                                          message: "Only numbers accepted for EmployeeID.",
                                          params: '^[0-9]+$'
                                        }
                                      });
  self.firstName = ko.observable(firstName).extend({
                                        required: true,
                                        pattern: {
                                          message: "Only letters, no numbers or symbols.",
                                          params: '^[a-zA-Z]+$'
                                        }
                                      });
  self.lastName = ko.observable(lastName).extend({
                                          required: true,
                                          pattern: {
                                            message: "Only letters, no numbers or symbols.",
                                            params: '^[a-zA-Z]+$'
                                          }
                                        });
  self.email = ko.observable(email).extend({ email: true });
}

function EmptyAssignee(){
  return new Assignee(0, "", "", "");
}

function LoadAssignee(assignee){
  return new Assignee(assignee.empID, assignee.firstName, assignee.lastName, assignee.email);
}

function LoadAssignees(newAssignees){
  var assignees = [];
  for (var i = 0; i < newAssignees.length; i++) {
    assignees.push(LoadAssignee(newAssignees[i]));
  };
  return assignees;
}

function CallLogViewModel() {
  var self = this;
  self.search = ko.observable("");
  self.logForm = ko.observable(false);
  self.logHistory = ko.observable(true);
  self.assignee = ko.validatedObservable(EmptyAssignee());
  self.logs = ko.observableArray([]);
  self.logForEdit = {};
  self.filtered = ko.observableArray([]);
  self.assignees = ko.observableArray([]);
  self.localStorage = false;
  self.status = ko.observableArray([
    "Open",
    "On hold",
    "Completed",
    "Cancelled"
  ]);
  self.category = ko.observableArray([]);
  self.description = ko.observable('');
  self.dashboard= ko.observable(false);
  self.home=ko.observable(true);
  self.admin=ko.observable(false);

  self.ShowDashboard = function (){
    self.dashboard(true);
    self.home(false);
    self.admin(false);
  };

  self.ShowHome = function(){
    self.home(true);
    self.dashboard(false);
    self.admin(false);
  };

  self.ShowAdmin = function(){
    self.admin(true);
    self.home(false);
    self.dashboard(false);
  };


  self.GetNextID = function () {
    if (self.logs().length > 0) {
      var sortedArray = self.logs().sort(function(l, r){ l.id() > r.id()})
      return sortedArray[sortedArray.length - 1].id() + 1;
    }
    else {
      return 1;
    }
  };

  self.log = ko.validatedObservable(EmptyLog(self.GetNextID()));

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
            || log.status().toLowerCase().indexOf(s.toLowerCase()) > -1
            || log.category().toLowerCase().indexOf(s.toLowerCase()) > -1
            || log.date().toLowerCase().indexOf(s.toLowerCase()) > -1){
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
    self.log(EmptyLog(self.GetNextID()));
    self.logForm(true);
    self.logHistory(false);
    self.new = true;
  };

  self.CancelLog = function () {
    self.logForm(false);
    self.logHistory(true);
  };

  self.EditLog = function(logToEdit){
    self.log(ParseLog(ko.toJS(logToEdit)));
    self.logForEdit = logToEdit;
    self.logForm(true);
    self.logHistory(false);
    self.new = false;
  };

  self.SaveLog = function (){
    if(self.log.isValid()){
      if (self.new !== true) {
        self.logs.remove(self.logForEdit);
      }
      self.logs.push(self.log());
      self.logForm(false);
      self.logHistory(true);
      self.SaveToLocalStorage();
    }
    else{
      $("#errorModal").modal("show");
    }

  };

  self.SaveAssignee = function () {

  };

  self.EditAssignee = function (assigneeToEdit) {
    self.log(assigneeToEdit);
    self.new = false;
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
    self.logs(ParseLogs(logs));
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
