const { response } = require('express');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path')
var adminHelpers = require('../helpers/admin-helpers')
var festHelpers = require('../helpers/fest-helpers');
const groupHelpers = require('../helpers/group-helpers');
const markHelpers = require('../helpers/mark-helpers')

const verifyAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/fest-admin/login')
  }
};
const verifyFestLogin = (req, res, next) => {
  if (req.session.fest) {
    next()
  } else {
    res.redirect('/fest-admin')
  }
};


/* GET users listing. */
/* HOme page */

router.get('/', verifyAdminLogin, async function (req, res, next) {

  var newDate = new Date();
  var CurrentYear = newDate.getFullYear();
  var latestFest = await festHelpers.latestFest(newDate)
  var latestFestZero = latestFest == true
  var allFest = await festHelpers.allFests()
  var allFestZero = allFest == true
  var LoginFest = req.session.fest


  if (req.session.festLoginErr) {
    res.render('admin/home', {
      title: 'College Fest', admin: true, adminHeader: true, latestFest, latestFestZero, allFest, allFestZero,
      "festLoginErr": req.session.festLoginErr, CurrentYear
    })
    req.session.festLoginErr = false
  } else if (req.session.fest) {
    res.render('admin/home', {
      title: 'College Fest', admin: true, adminHeader: true, latestFest, latestFestZero, allFest, allFestZero,
      LoginFest, CurrentYear
    })
  } else {

    res.render('admin/home', { title: 'College Fest', admin: true, adminHeader: true, latestFest, latestFestZero, allFestZero, allFest, CurrentYear })
  }
});

router.get('/settings', verifyAdminLogin, async (req, res) => {
  let Admin = await adminHelpers.getAdminDetails()
  let adminDetails = Admin[0]
  if (req.session.passwordChangeErr) {
    res.render('admin/settings', { title: 'Settings', admin: true, adminHeader: true, adminDetails, "passwordChangeErr": req.session.passwordChangeErr })
    req.session.passwordChangeErr = false
  } else if (req.session.passwordChangeSuccess) {
    res.render('admin/settings', { title: 'Settings', admin: true, adminHeader: true, adminDetails, "passwordChangeSuccess": req.session.passwordChangeSuccess })
    req.session.passwordChangeSuccess = false
  } else {
    res.render('admin/settings', { title: 'Settings', admin: true, adminHeader: true, adminDetails })

  }
});

router.post('/settings/change-password', verifyAdminLogin, (req, res) => {
  adminHelpers.changePassword(req.body).then((response) => {
    if (response) {
      req.session.passwordChangeSuccess = "Password Changed"
      res.redirect('/fest-admin/settings')
    } else {
      req.session.passwordChangeErr = "Incorrect Corrent password"
      res.redirect('/fest-admin/settings')

    }

  })
})


/* Login - LogOut */
router.get('/login', (req, res) => {

  if (req.session.admin) {
    res.redirect('/fest-admin')
  } else if (req.session.loginErr) {
    res.render('admin/login', { "loginErr": req.session.loginErr, title: 'Admin login', adminHeader: true })
    req.session.loginErr = false
  } else {
    res.render('admin/login', { adminHeader: true, title: 'Admin login' })
  }
});

router.post('/login', (req, res) => {

  adminHelpers.adminLogin(req.body).then((response) => {
    if (response.adminDetails) {
      req.session.admin = true
      req.session.EmailErr = false
      req.session.PasswordErr = false
      req.session.admin = response.adminDetails
      res.redirect('/fest-admin')
    } else if (response.EmailErr) {
      req.session.EmailErr = true
      req.session.loginErr = "Invalid email address"
      res.redirect('/fest-admin/login')
    } else {
      req.session.loginErr = "Incorrect password"
      res.redirect('/fest-admin/login')
    }
  })
});

router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.fest = null
  res.redirect('/fest-admin/')
});

/* Crate Fest */
router.get('/create-fest-page1', verifyAdminLogin, (req, res) => {

  res.render('admin/create-fest-1', { title: 'Create fest', createAccout: true, adminHeader: true })
});

router.post('/create-fest-page2', verifyAdminLogin, (req, res) => {
  festHelpers.sessionOneStore(req.body).then((data) => {
    var FestId = data.FestId
    var GroupCount = data.GroupCount

    res.render('admin/create-fest-2', { title: 'Create fest', createAccout: true, adminHeader: true, FestId, GroupCount })
  })
});

router.post('/create-fest-page3', (req, res) => {
  festHelpers.sessionTwoStore(req.body).then((data) => {

    var FestId = data.festId
    var NumberSessions = data.NumberSessionCount

    res.render('admin/create-fest-3', { title: 'Create fest', createAccout: true, adminHeader: true, FestId, NumberSessions })
  })
});

router.post('/create-fest-page4', verifyAdminLogin, (req, res) => {
  festHelpers.sessionThreeStore(req.body).then((FestId) => {

    res.render('admin/create-fest-4', { title: 'Create fest', createAccout: true, adminHeader: true, FestId })
  })
});
router.post('/create-fest-page5', verifyAdminLogin, (req, res) => {
  res.redirect('/fest-admin')
})
// forget password
router.get('/fest-forgot-password/45554:FestId/5485454', verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  if (req.session.FestIdError) {
    res.render('fest/fest-forgot', { title: 'College Fest', admin: true, adminHeader: true, FestId, "FestIdError": req.session.FestIdError })
    req.session.FestIdError = false
  } else if (req.session.festForgotPassword) {
    var forgotPassword = req.session.festForgotPassword
    res.render('fest/fest-forgot', { title: 'College Fest', admin: true, adminHeader: true, FestId, forgotPassword })
    req.session.festForgotPassword = false
  } else {
    res.render('fest/fest-forgot', { title: 'College Fest', admin: true, adminHeader: true, FestId })
  }
})
router.post('/fest-forgot-password/:FestId', verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  festHelpers.forgotFestPassword(req.body, FestId).then((Password) => {

    if (Password === undefined) {
      req.session.FestIdError = "Invalid Fest ID"
      res.redirect('/fest-admin/fest-forgot-password/45554' + FestId + '/5485454')

    } else {
      req.session.festForgotPassword = Password
      res.redirect('/fest-admin/fest-forgot-password/45554' + FestId + '/5485454')

    }
  })

});

router.get('/forgot-password', (req, res) => {

  res.render('admin/forgot-password', { "loginErr": req.session.loginErr, title: 'Admin login', adminHeader: true })
})

/* Fest - Home */
router.post('/:FestId/home', verifyAdminLogin, (req, res) => {
  var FestId = req.params.FestId

  festHelpers.FestLogin(FestId, req.body).then((response) => {
    if (response.festDetails) {

      req.session.fest = true
      req.session.festPasswordErr = false
      req.session.festLoginErr = false
      req.session.fest = response.festDetails
      var FestDetails = req.session.fest
      res.render('fest/fest-dashboard', { title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails })
    } else {
      req.session.festPasswordErr = true
      req.session.festLoginErr = "Incorrect password"
      res.redirect('/fest-admin')
    }
  })
});

router.get('/:FestId/home', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestDetails = req.session.fest
  res.render('fest/fest-dashboard', { title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails })
});

router.get('/:FestId/logout', verifyFestLogin, verifyAdminLogin, (req, res) => {
  var urlFestId = req.params.FestId
  if (req.session.fest.FestId === urlFestId) {
    req.session.fest = null
    res.redirect('/fest-admin')
  } else {
    res.redirect('/fest-admin')
  }

});

/* Fest - Events */
router.get('/:FestId/events', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest
  var allPointCategory = await festHelpers.getPointCategory(FestDetails.FestId)
  var categoryNull = allPointCategory == true
  var allItemCategorys = await festHelpers.getAllItemCategory(FestDetails.FestId)

  res.render('fest/events', {
    title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, categoryNull,
    allItemCategorys
  })
});

router.get('/:FestId/events/:SessionName-:Category', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest
  FestDetails.Session = req.params.SessionName
  FestDetails.Category = req.params.Category

  var allEvents = await festHelpers.getAllEvents(FestDetails)

  if (req.session.EventDeleteError) {
    res.render('fest/all-events', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails,
      allEvents, "EventDeleteError": req.session.EventDeleteError
    })
    req.session.EventDeleteError = false
  } else {
    res.render('fest/all-events', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails,
      allEvents
    })
  }
});
router.get('/:FestId/events/:Session-:Category/add-event', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  let FestDetails = req.session.fest
  FestDetails.Session = req.params.Session
  FestDetails.Category = req.params.Category
  var pointCategoryOptions = await festHelpers.getPointCategoryOptions(FestDetails.FestId)
  if (req.session.addEvent == true) {
    var successAddEvent = req.session.addEvent
    res.render('fest/add-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, pointCategoryOptions, successAddEvent
    })
    req.session.addEvent = false
  } else {
    res.render('fest/add-event', { title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, pointCategoryOptions })
  }
})

router.post('/:FestId/events/:Session-:Category/add-event', verifyFestLogin, verifyAdminLogin, (req, res) => {
  var FestId = req.params.FestId
  var SessionName = req.params.Session
  var CategoryName = req.params.Category
  festHelpers.addEvent(req.body, FestId, SessionName, CategoryName).then((FestId) => {
    if (FestId) {
      req.session.addEvent = true
      res.redirect('/fest-admin/' + FestId + '/events/' + SessionName + '-' + CategoryName + '/add-event')
    } else {
      res.redirect('/fest-admin/' + FestId + '/events/' + SessionName + '-' + CategoryName + '/add-event')
    }
  })
});

router.get('/:FestId/events/:Session-:Category/:EventId/delete-event', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  let SessionName = req.params.Session
  let CategoryName = req.params.Category
  let EventId = req.params.EventId
  festHelpers.deleteEvent(FestId, SessionName, CategoryName, EventId).then((response) => {
    if (response) {
      req.session.EventDeleteError = "Some students have added this event, please delete it first"
      res.redirect('/fest-admin/' + FestId + '/events/' + SessionName + '-' + CategoryName)
    } else {

      res.redirect('/fest-admin/' + FestId + '/events/' + SessionName + '-' + CategoryName)
    }
  })
});

router.get('/:FestId/events/:Session-:Category/:EventId-:EventName/all-students', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  let FestDetails = req.session.fest
  let SessionName = req.params.Session
  let CategoryName = req.params.Category
  let EventId = req.params.EventId
  let EventName = req.params.EventName
  let EventStudents = await festHelpers.getEventStudentsForAllGroup(FestDetails.FestId, SessionName, CategoryName, EventId)

  res.render('fest/event-all-students', {
    title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName, EventStudents,
    SessionName, CategoryName, EventId
  })
});

router.get('/:FestId/events/:Session-:Category/:EventId-:EventName/:GroupId/:ChestNo/delete-event', verifyAdminLogin, verifyFestLogin, (req, res) => {
  let FestDetails = req.session.fest
  let SessionName = req.params.Session
  let CategoryName = req.params.Category
  let EventId = req.params.EventId
  let ChestNo = req.params.ChestNo
  let GroupId = req.params.GroupId
  let EventName = req.params.EventName

  festHelpers.deleteStudentEvent(FestDetails.FestId, GroupId, ChestNo, EventId, SessionName).then(() => {
    res.redirect('/fest-admin/' + FestDetails.FestId + '/events/' + SessionName + '-' + CategoryName + '/' + EventId + '-' + EventName + '/all-students')
  })
});

router.get('/:FestId/events/:Session-:Category/:EventId-:EventName/add-students', verifyAdminLogin, verifyFestLogin, (req, res) => {

  let FestDetails = req.session.fest
  let SessionName = req.params.Session
  let CategoryName = req.params.Category
  let EventId = req.params.EventId
  let EventName = req.params.EventName

  if (req.session.EventAlreadyUsedError) {
    res.render('fest/add-student-in-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName,
      SessionName, CategoryName, EventId, "EventAlreadyUsedError": req.session.EventAlreadyUsedError
    })
    req.session.EventAlreadyUsedError = false

  } else if (req.session.Success) {
    res.render('fest/add-student-in-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName,
      SessionName, CategoryName, EventId, "Success": req.session.Success
    })
    req.session.Success = false

  } else if (req.session.StudentStageCountOver) {
    res.render('fest/add-student-in-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName,
      SessionName, CategoryName, EventId, "StudentStageCountOver": req.session.StudentStageCountOver
    })
    req.session.StudentStageCountOver = false

  } else if (req.session.StudentTotalCountOver) {
    res.render('fest/add-student-in-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName,
      SessionName, CategoryName, EventId, "StudentTotalCountOver": req.session.StudentTotalCountOver
    })
    req.session.StudentTotalCountOver = false

  } else if (req.session.EventLimitError) {
    res.render('fest/add-student-in-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName,
      SessionName, CategoryName, EventId, "EventLimitError": req.session.EventLimitError
    })
    req.session.EventLimitError = false

  } else if (req.session.ChestNOError) {
    res.render('fest/add-student-in-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName,
      SessionName, CategoryName, EventId, "ChestNOError": req.session.ChestNOError
    })
    req.session.ChestNOError = false
  } else {
    res.render('fest/add-student-in-event', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, EventName,
      SessionName, CategoryName, EventId
    })

  }
});

router.post('/:FestId/events/:Session-:Category/:EventId-:EventName/add-students', verifyAdminLogin, verifyFestLogin, (req, res) => {
  let FestDetails = req.session.fest
  let SessionName = req.params.Session
  let CategoryName = req.params.Category
  let EventId = req.params.EventId
  let EventName = req.params.EventName

  groupHelpers.addEvent(req.body).then((response) => {

    if (response.EventAlreadyUsedError) {
      req.session.EventAlreadyUsedError = "This event has already been used"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/events/' + SessionName + '-' + CategoryName + '/' + EventId + '-' + EventName + '/add-students')

    } else if (response.Success) {
      req.session.Success = "This event was successfully added"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/events/' + SessionName + '-' + CategoryName + '/' + EventId + '-' + EventName + '/add-students')

    } else if (response.StudentStageCountOver) {
      req.session.StudentStageCountOver = "This student can no longer participate in the category"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/events/' + SessionName + '-' + CategoryName + '/' + EventId + '-' + EventName + '/add-students')

    } else if (response.StudentTotalCountOver) {
      req.session.StudentTotalCountOver = "This student total event limit complited"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/events/' + SessionName + '-' + CategoryName + '/' + EventId + '-' + EventName + '/add-students')

    } else if (response.EventLimitError) {
      req.session.EventLimitError = "The total limit of this event is over"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/events/' + SessionName + '-' + CategoryName + '/' + EventId + '-' + EventName + '/add-students')

    } else if (response.ChestNOError) {
      req.session.ChestNOError = "Invalid chest no"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/events/' + SessionName + '-' + CategoryName + '/' + EventId + '-' + EventName + '/add-students')

    }
  })
})



/* Fest - Point Table */
router.get('/:FestId/point-table', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest
  var allPointCategory = await festHelpers.getPointCategory(FestDetails.FestId)
  var categoryNull = allPointCategory == true
  if (req.session.categoryNameErr == true) {
    let categoryError = req.session.categoryNameErr
    res.render('fest/point-table', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails,
      allPointCategory, categoryNull, categoryError
    })
    req.session.categoryNameErr = false
  } else if (req.session.pointCategoryEvent) {
    categoryError = req.session.categoryNameErr
    eventError = req.session.pointCategoryEvent
    res.render('fest/point-table', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails,
      allPointCategory, categoryNull, eventError
    })
    req.session.pointCategoryEvent = false
  } else {

    res.render('fest/point-table', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails,
      allPointCategory, categoryNull
    })
  }

})
router.get('/:FestId/point-table/add-table', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestDetails = req.session.fest
  res.render('fest/add-pointTable', { title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails })
})

router.post('/:FestId/point-table/add-table', verifyFestLogin, verifyAdminLogin, (req, res) => {
  festHelpers.addPointCategory(req.body).then((response) => {

    if (response == true) {
      let FestId = req.session.fest.FestId
      req.session.categoryNameErr = true

      res.redirect('/fest-admin/' + FestId + '/point-table')
    } else {
      res.redirect('/fest-admin/' + response + '/point-table')
    }
  })
});

router.get('/:FestId/point-table/delete/:categoryName', verifyFestLogin, verifyAdminLogin, (req, res) => {
  var FestId = req.params.FestId
  var categoryName = req.params.categoryName
  festHelpers.deletePointCategory(FestId, categoryName).then((event) => {
    if (event) {
      req.session.pointCategoryEvent = "A few events have been added to this category, delete the event first"
      res.redirect('/fest-admin/' + FestId + '/point-table')

    } else {

      res.redirect('/fest-admin/' + FestId + '/point-table')
    }
  })
});

/* Groups */

router.get('/:FestId/groups', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var AllGroups = await festHelpers.getAllGroups(FestDetails.FestId)

  res.render('fest/group', { title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails, AllGroups })
});

router.post('/:FestId/groups/:GroupName/confierm', verifyFestLogin, verifyAdminLogin, (req, res) => {
  var FestId = req.params.FestId
  var GroupName = req.params.GroupName

  festHelpers.ActivateGroup(FestId, GroupName, req.body).then(() => {
    res.redirect('/fest-admin/' + FestId + '/groups')
  })
});

router.get('/:FestId/groups/:GroupId/view', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  let GroupDetails = await groupHelpers.getGroupDetails(GroupId, FestDetails.FestId)
  let allItemCategorys = await festHelpers.getAllItemCategory(FestDetails.FestId)

  await groupHelpers.getAllCategorys(GroupDetails).then((result) => {
    let AllSessions = []
    if (result.Session6 !== undefined) {
      AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4, result.Session5, result.Session6]
    } else if (result.Session2 === undefined) {
      AllSessions = [result.Session1]
    } else if (result.Session3 === undefined) {
      AllSessions = [result.Session1, result.Session2]
    } else if (result.Session4 === undefined) {
      AllSessions = [result.Session1, result.Session2, result.Session3]
    } else if (result.Session5 === undefined) {
      AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4]
    } else if (result.Session6 === undefined) {
      AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4, result.Session5]
    }
    res.render('fest/view-group', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, FestDetails,
      GroupDetails, AllSessions, allItemCategorys
    })
  })
});


router.get('/:FsetId/groups/:GroupId/:SessionName/students', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  let GroupDetails = await groupHelpers.getGroupDetails(GroupId, FestDetails.FestId)
  let SessionName = req.params.SessionName
  let EventLimit = await festHelpers.getStudentEventLimit(FestDetails.FestId, GroupId, SessionName)
  let AllStudents = await groupHelpers.getAllStudents(SessionName, GroupDetails)
  if (req.session.studentEventTrueError) {
    res.render('fest/view-group-students', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, GroupDetails, AllStudents
      , EventLimit, "studentEventTrueError": req.session.studentEventTrueError
    })
    req.session.studentEventTrueError = false

  } else {
    res.render('fest/view-group-students', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, GroupDetails, AllStudents
      , EventLimit
    })

  }
});

router.get('/:FsetId/groups/:GroupId/:SessionName/students/add-student', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  let SessionName = req.params.SessionName
  if (req.session.cicNOError) {
    res.render('fest/add-students', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, GroupId,
      "cicNOError": req.session.cicNOError
    })
    req.session.cicNOError = false
  } else if (req.session.cicNoSuccess) {
    res.render('fest/add-students', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, GroupId,
      "cicNoSuccess": req.session.cicNoSuccess
    })
    req.session.cicNoSuccess = false
  } else {
    res.render('fest/add-students', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, GroupId
    })
  }
});
router.post('/:FsetId/groups/:GroupId/:SessionName/students/add-student', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  let SessionName = req.params.SessionName
  let GroupDetails = await groupHelpers.getGroupDetails(GroupId, FestDetails.FestId)
  groupHelpers.addStudents(SessionName, GroupDetails, req.body).then((response) => {

    if (response) {
      req.session.cicNOError = "This CIC number already used"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/groups/' + GroupId + '/' + SessionName + '/students/add-student')
    } else {
      req.session.cicNoSuccess = "Student added success"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/groups/' + GroupId + '/' + SessionName + '/students/add-student')
    }
  })
});

router.get('/:FestId/groups/:GroupId/:SessionName/students/:ChestNo/view', verifyAdminLogin, verifyFestLogin, async (req, res) => {

  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  let SessionName = req.params.SessionName
  let ChestNo = req.params.ChestNo
  let studentEvents = await festHelpers.getOneStudentEvents(FestDetails.FestId, GroupId, SessionName, ChestNo)
  let EventLimit = await festHelpers.getStudentEventLimit(FestDetails.FestId, GroupId, SessionName)
  let studentLimitCount = await festHelpers.getStudentEventCount(FestDetails.FestId, ChestNo)

  res.render('fest/view-group-student-events', {
    title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, studentEvents, GroupId,
    studentLimitCount, EventLimit
  })
});

router.get('/:FestId/groups/:GroupId/:SessionName/students/:ChestNo/delete', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestId = req.session.fest.FestId
  var GroupId = req.params.GroupId
  var SessionName = req.params.SessionName
  let ChestNo = req.params.ChestNo
  groupHelpers.removeStudent(FestId, GroupId, ChestNo, SessionName).then((response) => {

    if (response === undefined) {
      res.redirect('/fest-admin/' + FestId + '/groups/' + GroupId + '/' + SessionName + '/students')
    } else if (response.studentEventTrueError) {
      req.session.studentEventTrueError = "A few events have been added to this student, delete the event first"

      res.redirect('/fest-admin/' + FestId + '/groups/' + GroupId + '/' + SessionName + '/students')
    }
  })

})

router.get('/:FestId/groups/:GroupId/:SessionName/students/:ChestNo-:EventId/delete-event', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestId = req.session.fest.FestId
  var GroupId = req.params.GroupId
  var SessionName = req.params.SessionName
  let ChestNo = req.params.ChestNo
  let EventId = req.params.EventId

  festHelpers.deleteStudentEvent(FestId, GroupId, ChestNo, EventId, SessionName).then(() => {

    res.redirect('/fest-admin/' + FestId + '/groups/' + GroupId + '/' + SessionName + '/students/' + ChestNo + '/view')
  })
})

router.get('/:FestId/groups/:GroupId/:SessionName/:Category/Events', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  var SessionName = req.params.SessionName
  var Category = req.params.Category
  FestDetails.Session = req.params.SessionName
  FestDetails.Category = req.params.Category
  var allEvents = await festHelpers.getAllEvents(FestDetails)

  res.render('fest/view-group-event', {
    title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, GroupId,
    Category, allEvents
  })
});

router.get('/:FestId/groups/:GroupId/:SessionName/:Category/Events/:EventId/:EventName/students', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  var SessionName = req.params.SessionName
  var Category = req.params.Category
  var EventId = req.params.EventId
  var EventName = req.params.EventName
  festHelpers.getStudentsinEvent(FestDetails.FestId, GroupId, EventId).then((EventStudents) => {

    res.render('fest/view-group-event-students', {
      title: FestDetails.FestName, festHeader: true, createAccout: true, adminHeader: true, SessionName, FestDetails, GroupId,
      Category, EventStudents, EventName
    })
  })
})

// Control panel  

router.get('/:FestId/control-panel', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest
  let allGroups = await festHelpers.getAllGroups(FestDetails.FestId)
  let Fest = await festHelpers.getFestDetails(FestDetails.FestId)
  res.render('fest/control-panel', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true, Fest,
    allGroups
  })
});

router.post('/activateSession', (req, res, next) => {
  festHelpers.activateGroupSession(req.body).then((response) => {

    res.json(response)
  })
});

router.post('/OnStudents', (req, res, next) => {
  festHelpers.TimeOnOffStudents(req.body).then((response) => {

    res.json(response)
  })
});
router.post('/ShowEditOption', (req, res, next) => {
  festHelpers.ShowEditOption(req.body).then((response) => {

    res.json(response)
  })
});
router.post('/OnEvents', (req, res, next) => {
  festHelpers.TimeOnOffEvents(req.body).then((result) => {

    res.json(result)
  })
});
router.post('/activeUser', (req, res, next) => {
  festHelpers.activeUser(req.body).then((result) => {

    res.json(result)
  })
});

// Settings

router.get('/:FestId/settings/fest-profile', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest
  let FestFullDetails = await festHelpers.getFestDetails(FestDetails.FestId)
  var AllGroups = await festHelpers.getAllGroups(FestDetails.FestId)

  if (req.session.passwordChangeErr) {

    res.render('fest/profile-settings', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      FestFullDetails, "passwordChangeErr": req.session.passwordChangeErr, AllGroups
    })
    req.session.passwordChangeErr = false
  } else if (req.session.passwordChangeSuccess) {

    res.render('fest/profile-settings', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      FestFullDetails, "passwordChangeSuccess": req.session.passwordChangeSuccess, AllGroups
    })
    req.session.passwordChangeSuccess = false
  } else {

    res.render('fest/profile-settings', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      FestFullDetails, AllGroups
    })
  }
});

router.post('/:FestId/settings/fest-profile/imageUpload', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  let image = req.files.profile
  image.mv('./public/images/fest-logo/' + FestId + '.jpg')
  res.redirect('/fest-admin/' + FestId + '/settings/fest-profile')

});

router.post('/:FestId/settings/fest-profile/editFestDetails', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  festHelpers.editFestDetails(req.body).then(() => {

    req.session.fest.FestName = req.body.FestName,
      req.session.fest.FestDate = req.body.FestDate,
      req.session.fest.FestConvener = req.body.FestConvener,
      req.session.fest.NumberGroups = req.body.NumberGroups,
      req.session.fest.NumberSessions = req.body.NumberSessions

    res.redirect('/fest-admin/' + FestId + '/settings/fest-profile')
  })
});

router.post('/:FestId/settings/fest-profile/change-password', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  festHelpers.changePassword(req.body).then((response) => {

    if (response) {

      req.session.passwordChangeSuccess = "Password Changed"
      res.redirect('/fest-admin/' + FestId + '/settings/fest-profile')
    } else {

      req.session.passwordChangeErr = "Incorrect Corrent password"
      res.redirect('/fest-admin/' + FestId + '/settings/fest-profile')
    }
  })
});

router.get('/:FestId/settings/fest-profile/edit-group/:GroupName', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest
  let GroupName = req.params.GroupName
  let GroupDetailsWithName = await festHelpers.getGroupDetailsWithName(FestDetails.FestId, GroupName)

  res.render('fest/edit-group-settings', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
    GroupDetailsWithName
  })
});

router.post('/:FestId/settings/fest-profile/edit-group', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  festHelpers.editGroupDetails(FestId, req.body).then((response) => {
    res.redirect('/fest-admin/' + FestId + '/settings/fest-profile')
  })
});

router.get('/:FestId/settings/fest-profile/delete-group/:GroupName', verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  let GroupName = req.params.GroupName

  festHelpers.deleteGroup(FestId, GroupName).then((response) => {
    res.redirect('/fest-admin/' + FestId + '/settings/fest-profile')
  })
});

router.get('/:FestId/settings/fest-profile/delete-fest', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId

  festHelpers.deleteFest(FestId).then(() => {
    let Imagepath = path.join(__dirname, '../public/images/fest-logo/' + FestId + '.jpg')

    fs.unlink(Imagepath, function (error) {
      if (error) {

      }

      req.session.fest = null
      res.redirect('/fest-admin')
    })

  })
})

router.get('/:FestId/settings', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestDetails = req.session.fest
  res.render('fest/settings', { title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true })
});

router.get('/:FestId/settings/sessions', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest
  let allGroups = await festHelpers.getAllGroups(FestDetails.FestId)
  let allSessions = [allGroups[0].Session1, allGroups[0].Session2, allGroups[0].Session3, allGroups[0].Session4, allGroups[0].Session5, allGroups[0].Session6]

  res.render('fest/sessions-Settings', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
    allSessions
  })
});

router.post('/:FestId/settings/sessions/eventsquantity', verifyFestLogin, verifyAdminLogin, (req, res) => {
  let FestId = req.params.FestId
  festHelpers.addEventsQuantity(FestId, req.body).then(() => {
    res.redirect('/fest-admin/' + FestId + '/settings/sessions')
  })
})


router.get('/:FestId/settings/students', verifyFestLogin, verifyAdminLogin, async (req, res) => {
  let FestDetails = req.session.fest

  res.render('fest/students-settings', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,

  })
});



// Other
router.get('/:FestId/program-schedule', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  FestDetails = req.session.fest
  let allSchedules = await festHelpers.getAllProgramSchedules(FestDetails.FestId)
  res.render('fest/program-shedule', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
    allSchedules
  })
});

router.post('/:FestId/program-schedule/add', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest

  festHelpers.addProgramSchedule(req.body, FestDetails.FestId).then(() => {
    let pdfFile = req.files.programShedule
    var id = req.body._id
    pdfFile.mv('./public/files/program-schedules/' + FestDetails.FestId + req.body.title + '.pdf', (err) => {
      if (!err) {
        res.redirect('/fest-admin/' + FestDetails.FestId + '/program-schedule')
      } else {

      }
    })
  })
});

router.get('/:FestId/program-schedules/:Title-:id/delete', verifyAdminLogin, verifyFestLogin, (req, res) => {
  FestDetails = req.session.fest
  Title = req.params.Title
  id = req.params.id
  festHelpers.deleteProgramSchedule(id, FestDetails.FestId).then(() => {

    let pdfPath = path.join(__dirname, '../public/files/program-schedules/' + FestDetails.FestId + Title + '.pdf')
    fs.unlink(pdfPath, function (error) {
      if (error) {
      }
      res.redirect('/fest-admin/' + FestDetails.FestId + '/program-schedule')
    })


  })
});

router.get('/:FestId/notification-settings', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  FestDetails = req.session.fest
  var AllGroups = await festHelpers.getAllGroups(FestDetails.FestId)
  if (req.session.messageSend) {
    res.render('fest/notification', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups, "messageSend": req.session.messageSend
    })
    req.session.messageSend = false
  } else {

    res.render('fest/notification', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups
    })
  }
});

router.post('/:FestId/notification-settings/send', verifyAdminLogin, verifyFestLogin, (req, res) => {
  FestDetails = req.session.fest
  festHelpers.sendMessage(req.body, FestDetails.FestId).then((response) => {

    if (response) {
      req.session.messageSend = 'Message sended'
      res.redirect('/fest-admin/' + FestDetails.FestId + '/notification-settings')
    } else {
      res.redirect('/fest-admin/' + FestDetails.FestId + '/notification-settings')
    }
  })
});

router.get('/:FestId/notification-settings/all', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var AllGroups = await festHelpers.getAllGroups(FestDetails.FestId)
  res.render('fest/all-notifications', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
    AllGroups
  })
});

router.get('/:FestId/notification-settings/all/:GroupId-:GroupName/notifications', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var GroupId = req.params.GroupId
  var GroupName = req.params.GroupName
  let FullNotifications = await groupHelpers.getFullNotifications(FestDetails.FestId, GroupId)
  res.render('fest/group-notifications', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true, FullNotifications, GroupName, GroupId
  })
})
router.get('/:FestId/notification-settings/all/commen/notifications', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  let CommenNotifications = await festHelpers.getCommenNotifications(FestDetails.FestId,)

  res.render('fest/commen-notifications', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true, CommenNotifications,
  })
})
router.get('/:FestId/notification-settings/all/commen/notifications/:MessageId/view', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var MessageId = req.params.MessageId
  let Message = await groupHelpers.getOneMessageWithOutGroupId(FestDetails.FestId, MessageId)
  res.render('fest/view-notification', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true, Message
  })
});

router.get('/:FestId/notification-settings/all/commen/notifications/:MessageId/delete', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  var MessageId = req.params.MessageId
  festHelpers.deleteNotificationWithoutGroupId(FestDetails.FestId, MessageId).then(() => {
    res.redirect('/fest-admin/' + FestDetails.FestId + '/notification-settings/all/commen/notifications')
  })

});

router.get('/:FestId/notification-settings/all/commen/notifications/:GroupId-:GroupName/:MessageId/delete', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  var MessageId = req.params.MessageId
  var GroupId = req.params.GroupId
  var GroupName = req.params.GroupName
  festHelpers.deleteNotification(FestDetails.FestId, GroupId, MessageId).then(() => {
    res.redirect('/fest-admin/' + FestDetails.FestId + '/notification-settings/all/' + GroupId + '-' + GroupName + '/notifications')
  })
})
router.get('/:FestId/notification-settings/all/commen/notifications/:GroupId-:GroupName/:MessageId/recover', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  var MessageId = req.params.MessageId
  var GroupId = req.params.GroupId
  var GroupName = req.params.GroupName
  festHelpers.recoverNotification(FestDetails.FestId, GroupId, MessageId).then(() => {
    res.redirect('/fest-admin/' + FestDetails.FestId + '/notification-settings/all/' + GroupId + '-' + GroupName + '/notifications')
  })
})

// Add mark

router.get('/:FestId/mark', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var allItemCategorys = await festHelpers.getAllItemCategory(FestDetails.FestId)
  res.render('mark/mark-home', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
    allItemCategorys
  })
});

router.get('/:FestId/mark/:SessionName-:Category', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var SessionName = req.params.SessionName
  var Category = req.params.Category
  FestDetails.Session = SessionName
  FestDetails.Category = Category
  var allEvents = await festHelpers.getAllEvents(FestDetails)

  res.render('mark/category-events', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
    allEvents
  })
});

router.get('/:FestId/mark/:Session-:Category/:TypeOfEvent/:EventId-:EventName/add-mark', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  var Session = req.params.Session
  var Category = req.params.Category
  var TypeOfEvent = req.params.TypeOfEvent
  FestDetails.Session = Session
  FestDetails.Category = Category
  var EventId = req.params.EventId
  var EventName = req.params.EventName
  var Individual = TypeOfEvent === "Individual"
  var Group = TypeOfEvent = "Group"
  var pointCategory = await markHelpers.getPointCategoryWithEventId(FestDetails.FestId, Session, Category, EventId)
  let EventStudents = await festHelpers.getEventStudentsForAllGroupwithOnlythisEvent(FestDetails.FestId, Session, Category, EventId)
  let AllGroups = await festHelpers.getAllGroups(FestDetails.FestId)
  if (EventStudents) {
    for (let i = 0; i < AllGroups.length; i++) {
      for (let a = 0; a < EventStudents.length; a++) {
        if (EventStudents[a].GroupId === AllGroups[i].GroupId) {
          AllGroups[i].student = EventStudents[a]
        }
      }
    }
  }
 
  res.render('mark/add-mark', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true, EventId, Session
    , EventName, EventStudents, Individual, Group, AllGroups, EventId, pointCategory
  })
});

router.post('/:FestId/mark/:Session-:Category/Individual/:EventId-:EventName/add-mark', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  var Session = req.params.Session
  var Category = req.params.Category
  var EventId = req.params.EventId
  var EventName = req.params.EventName

  markHelpers.addIndividualMark(req.body, FestDetails.FestId, Session, Category, EventId).then(() => {
    res.redirect('/fest-admin/' + FestDetails.FestId + '/mark/' + FestDetails.Session + '-' + Category + '/Individual/' + EventId + '-' + EventName + '/add-mark')

  })
})
router.post('/:FestId/mark/:Session-:Category/Group/:EventId-:EventName/add-mark', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  var Session = req.params.Session
  var Category = req.params.Category
  var EventId = req.params.EventId
  var EventName = req.params.EventName

  markHelpers.addGroupMark(req.body, FestDetails.FestId, Session, Category, EventId).then(() => {
    res.redirect('/fest-admin/' + FestDetails.FestId + '/mark/' + FestDetails.Session + '-' + Category + '/Group/' + EventId + '-' + EventName + '/add-mark')

  })
});

router.get('/:FestId/mark/add_other_mark', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  let AllGroups = await festHelpers.getAllGroups(FestDetails.FestId)
  let result = await markHelpers.getAllCategorysWithFestIdOnly(FestDetails.FestId)
  let AllSessions = []
  if (result.Session6 !== undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4, result.Session5, result.Session6]
  } else if (result.Session2 === undefined) {
    AllSessions = [result.Session1]
  } else if (result.Session3 === undefined) {
    AllSessions = [result.Session1, result.Session2]
  } else if (result.Session4 === undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3]
  } else if (result.Session5 === undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4]
  } else if (result.Session6 === undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4, result.Session5]
  }
  if (req.session.otherMarkSuccess) {
    res.render('mark/add-other-mark', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups, AllSessions, 'otherMarkSuccess': req.session.otherMarkSuccess
    })
    req.session.otherMarkSuccess = false
  } else if (req.session.otherMarkError) {
    res.render('mark/add-other-mark', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups, AllSessions, "otherMarkError": req.session.otherMarkError
    })
    req.session.otherMarkError = false
  } else {
    res.render('mark/add-other-mark', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups, AllSessions
    })
  }
});

router.post('/:FestId/mark/add_other_mark', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  markHelpers.addOtherMark(req.body).then((response) => {
    if (response) {
      req.session.otherMarkSuccess = "New other mark added"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/mark/add_other_mark')
    } else {
      req.session.otherMarkError = "Invalid Chest no"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/mark/add_other_mark')
    }
  })
});


router.get('/:FestId/mark/add_toppers', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  let AllGroups = await festHelpers.getAllGroups(FestDetails.FestId)
  let result = await markHelpers.getAllCategorysWithFestIdOnly(FestDetails.FestId)
  let AllSessions = []
  if (result.Session6 !== undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4, result.Session5, result.Session6]
  } else if (result.Session2 === undefined) {
    AllSessions = [result.Session1]
  } else if (result.Session3 === undefined) {
    AllSessions = [result.Session1, result.Session2]
  } else if (result.Session4 === undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3]
  } else if (result.Session5 === undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4]
  } else if (result.Session6 === undefined) {
    AllSessions = [result.Session1, result.Session2, result.Session3, result.Session4, result.Session5]
  }
  if (req.session.otherMarkSuccess) {
    res.render('mark/add-toppers', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups, AllSessions, 'otherMarkSuccess': req.session.otherMarkSuccess
    })
    req.session.otherMarkSuccess = false
  } else if (req.session.otherMarkError) {
    res.render('mark/add-toppers', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups, AllSessions, "otherMarkError": req.session.otherMarkError
    })
    req.session.otherMarkError = false
  } else {
    res.render('mark/add-toppers', {
      title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
      AllGroups, AllSessions
    })
  }
});

router.post('/:FestId/mark/add_toppers', verifyAdminLogin, verifyFestLogin, (req, res) => {
  var FestDetails = req.session.fest
  markHelpers.addToppers(req.body).then((response) => {
    if (response) {
      req.session.otherMarkSuccess = "New Toppers created"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/mark/add_toppers')
    } else {
      req.session.otherMarkError = "Invalid Chest no"
      res.redirect('/fest-admin/' + FestDetails.FestId + '/mark/add_toppers')
    }
  })
});


// Result

router.get('/:FestId/result', verifyAdminLogin, verifyFestLogin, async (req, res) => {
  var FestDetails = req.session.fest
  

  res.render('mark/result-home', {
    title: FestDetails.FestName, festHeader: true, FestDetails, createAccout: true, adminHeader: true,
  })
});


module.exports = router;