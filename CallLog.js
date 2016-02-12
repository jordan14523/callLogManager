function FormattedDate(date){
  return date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' +('0' + date.getDate()).slice(-2);
}

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
  return new Log(id, '', FormattedDate(new Date()), '' , '', '', 'In Progress', 0, 'Open', '', '');

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

function GetLastWeekDates(){
  var dates = [];
  var setDate = new Date();
  for (var i = 6; i >= 0; i--) {
    setDate.setDate(new Date().getDate() - i);
    dates.push(FormattedDate(setDate));
  }
  return dates;
}

function CreatePieChart(data){
  $("#chart").kendoChart({
        title: {
            position: "bottom",
            text: "Calls by category"
        },
        legend: {
            visible: false
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            labels: {
                visible: true,
                background: "transparent",
                template: "#= category #: #= value#"
            }
        },
        series: [{
            type: "pie",
            startAngle: 150,
            data: callLogViewModel.GetCategoryChartData()
        }],
        tooltip: {
            visible: true,
            format: "{0}"
        }
    });
};


function CreateBarChart(series){
  $("#chart").kendoChart({
    title: {
        text: "Calls by Assignee"
    },
    legend: {
        visible: false
    },
    seriesDefaults: {
        type: "column",
    },
    series: [{
        name: "Call Count",
        data: series.data
    }],
    valueAxis: {
        line: {
            visible: false
        }
    },
    categoryAxis: {
        categories: series.assignees,
        majorGridLines: {
            visible: false
        }
    },
    tooltip: {
        visible: true,
        template:  "#= series.name #: #= value#"
    }
  });
};

function CreateDailyChart(series) {
    $("#chart").kendoChart({
        title: {
            text: "Gross domestic product growth \n /GDP annual %/"
        },
        legend: {
            visible: false
        },
        seriesDefaults: {
            type: "line",
            style: "smooth"
        },
        series: [{
            name: "Calls",
            data: series.data
        }],
        valueAxis: {
            labels: {
                format: "{0}"
            },
            axisCrossingValue: -1
        },
        categoryAxis: {
            categories: series.dates,
            labels: {
                rotation: "auto"
            }
        },
        tooltip: {
            visible: true,
            format: "{0}%",
            template: "#= series.name #: #= value #"
        }
    });
}

function CallLogViewModel() {
  var self = this;


  self.search = ko.observable("");
  self.logForm = ko.observable(false);
  self.logHistory = ko.observable(true);
  self.assignee = ko.validatedObservable(EmptyAssignee());
  self.assigneeToEdit = {};
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
  self.category = ko.observable('');
  self.categoryToEdit = '';
  self.categories = ko.observableArray([]);
  self.description = ko.observable('');
  self.dashboard= ko.observable(false);
  self.home=ko.observable(true);
  self.admin=ko.observable(false);
  self.errorMessage = ko.observable("");
  self.new = true;
  self.assigneeNew = true;
  self.categoryNew = true;
  self.categoryPlot = ko.observable(false);
  self.assigneePlot = ko.observable(false);
  self.dailyPlot = ko.observable(false);

  self.GetNextLogID = function(){
    return self.GetNextID(self.logs(), "id");
  };

  self.GetNextID = function (objectArray, idField) {
    if (objectArray.length > 0) {
      var sortedArray = objectArray.sort(function(l, r){ l[idField]() > r[idField]()})
      return sortedArray[sortedArray.length - 1][idField]() + 1;
    }
    else {
      return 1;
    }
  };

  self.log = ko.validatedObservable(EmptyLog(self.GetNextLogID()));

  self.ShowDashboard = function (){
    self.dashboard(true);
    self.home(false);
    self.admin(false);
    self.ShowCategoryPlot();
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

  self.GetCategoryChartData = function(){
    var data = [];
    for (var i = 0; i < self.logs().length; i++) {
      var currentCat = self.logs()[i].category();
      var found = false;
      for (var j = 0; j < data.length; j++) {
        if(data[j].category == currentCat){
          data[j].value += 1;
        }
      }
      if (!found) {
        data.push({ category: currentCat, value: 1 });
      }
    }
    return data;
  };

  self.GetFullName = function (assignee) {
    return assignee.firstName() + " " + assignee.lastName();
  };

  self.GetAssigneeChartData = function(){
    var series = { assignees: [], data:[]};

    for (var i = 0; i < self.assignees().length; i++) {
      var currAssignee = self.assignees()[i];
      series.assignees.push(self.GetFullName(currAssignee));
      var count = 0;
      for (var j = 0; j < self.logs().length; j++) {
        var currLog =self.logs()[j];
        if(currLog.assignee() === currAssignee.empID()){
          count += 1;
        }
      }
      series.data.push(count);
    }

    return series;
  };

  self.GetDailyChartData = function(){
    var series = { dates: [], data: [] };
    var dates = GetLastWeekDates();

    for (var i = 0; i < dates.length; i++) {
      var currDate = dates[i];
      var count = 0;
      for (var j = 0; j < self.logs().length; j++) {
        var currLog = self.logs()[j];
        if(currLog.date() === currDate){
          count += 1
        }
      }
      series.dates.push(currDate);
      series.data.push(count);
    }

    return series;
  }

  self.ShowCategoryPlot = function(){
    self.categoryPlot(true);
    self.assigneePlot(false);
    self.dailyPlot(false);
    CreatePieChart(self.GetCategoryChartData());
  }
  self.ShowAssigneePlot = function(){
    self.assigneePlot(true);
    self.categoryPlot(false);
    self.dailyPlot(false);
    CreateBarChart(self.GetAssigneeChartData());
  }
  self.ShowDailyPlot = function(){
    self.dailyPlot(true);
    self.categoryPlot(false);
    self.assigneePlot(false);
    CreateDailyChart(self.GetDailyChartData());
  }

  self.IsDuplicateAssigneeID = function(empID){
    return self.IsDuplicateID(self.assignees(), "empID", self.assignee().empID());
  };

  self.IsDuplicateID = function(objectArray, idField, id){
    for (var i = 0; i < objectArray.length; i++) {
      if(objectArray[i][idField]() == id){
        return true;
      }
    }
      return false;
  };

  self.IsDuplicateCategory = function(){
    for (var i = 0; i < self.categories().length; i++) {
      if(self.categories()[i].toLowerCase() == self.category().toLowerCase())
        return true;
    }
    return false;
  };

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
    self.log(EmptyLog(self.GetNextLogID()));
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
      self.errorMessage("Unable to save. Incorrect input, please check error messages in red.");
      $("#errorModal").modal("show");
    }

  };

  self.EditAssignee = function (assigneeToEdit) {
    self.assignee(LoadAssignee(ko.toJS(assigneeToEdit)));
    self.assigneeToEdit = assigneeToEdit;
    self.assigneeNew = false;
  };

  self.SaveAssignee = function () {
    if (!self.assignee.isValid()) {
      self.errorMessage("Unable to save. Incorrect input, please check error messages in red.");
      $("#errorModal").modal("show");
    }
    else{
      if (self.assigneeNew !== true) {
        self.assignees.remove(self.assigneeToEdit);
      }
      else{
        if(self.IsDuplicateAssigneeID()){
          self.errorMessage("Unable to save. Duplicate Employee Id: " + self.assignee().empID() + ".");
          $("#errorModal").modal("show");
          return;
        }
      }
      self.assigneeNew = true;
      self.assignees.push(self.assignee());
      self.assignee(EmptyAssignee());
      self.SaveToLocalStorage();
   }
  };

  self.SaveCategory = function () {
    if (self.categoryNew) {
      if(self.IsDuplicateCategory()){
        self.errorMessage("Unable to save. Duplicate Category.");
        $("#errorModal").modal("show");
        return;
      }
    }
    else{
      self.categories.remove(self.categoryToEdit);
    }
    self.categoryNew = true;
    self.categories.push(self.category());
    self.category('');
    self.SaveToLocalStorage();
  };

  self.EditCategory = function(categoryToEdit) {
    self.category(categoryToEdit);
    self.categoryToEdit = categoryToEdit;
    self.categoryNew = false;
  }

  self.SaveToLocalStorage = function() {
    localStorage.callLogApp = true;
    localStorage.logs = ko.toJSON(self.logs);
    localStorage.assignees = ko.toJSON(self.assignees);
    localStorage.categories = ko.toJSON(self.categories);
  };

  self.LoadFromLocalStorage = function () {
    var logs = JSON.parse(localStorage.logs);
    var assignees = JSON.parse(localStorage.assignees);
    var categories = JSON.parse(localStorage.categories);
    self.logs(ParseLogs(logs));
    self.assignees(LoadAssignees(assignees));
    self.categories(categories);
  };

  self.Init = function(){
    if(self.localStorage){
      self.SaveToLocalStorage();
    }
    self.Filter();
  };
} //End view model

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
  vm.categories(["Login issue", "Software request", "Hardware request"]);
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

ko.validation.init({insertMessages: false});
callLogViewModel.Init();
ko.applyBindings(callLogViewModel);
