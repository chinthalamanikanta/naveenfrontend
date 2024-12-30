import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; 
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';


function LeaveRequestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', employeeId: '', email: '', managerId: '', managerEmail: '', phone: '', 
    position: '', managerName: 'Raja', leaveRequestFor: 'Days', leaveType: '', leaveStartDate: '',
    leaveEndDate: '', duration: '', comments: '', medicalDocument:null
  });
  const [selectedFile, setSelectedFile] = useState(null); // New state for file upload
  const [errors, setErrors] = useState(false);
  const [isCommentsEnabled, setIsCommentsEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [leaveError, setLeaveError] = useState(''); // To set leave balance error from backend
  const [loading, setLoading] = useState(false);
  //const [remainingLeaves, setRemainingLeaves] = useState({}); // store the remaining leaves
  const [isCalendarVisibleStart, setIsCalendarVisibleStart] = useState(false); // To toggle calendar visibility for start date
  const [isCalendarVisibleEnd, setIsCalendarVisibleEnd] = useState(false); // To toggle calendar visibility for end date
 
  useEffect(() => {
    if (location.state && location.state.edit) {
      setIsEditing(true);
      setFormData(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Close calendar if clicked outside of the calendar
      if (
        e.target.closest('.calendar-wrapper-start') === null &&
        e.target.closest('.calendar-wrapper-end') === null
      ) {
        setIsCalendarVisibleStart(false);
        setIsCalendarVisibleEnd(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);

    // Cleanup the event listener when component is unmounted or re-rendered
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);
 

 

  const handleChange = (e) => {
    const { name, value } = e.target;

    // check if the field is for file upload
   
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

  

    if (name === 'leaveType') {
      setIsCommentsEnabled(value === 'OTHERS');
    }

    if (name === 'leaveStartDate' || name === 'leaveEndDate') {
      const duration = calculateDuration(
        name === 'leaveStartDate' ? value : formData.leaveStartDate,
        name === 'leaveEndDate' ? value : formData.leaveEndDate
      );
      setFormData(prevData => ({
        ...prevData,
        duration
      }));
    }
  };

  const handleFileChange=(event)=>{
    //  const { name} = event.target;
    const file=event.target.files[0];
    setSelectedFile(file);  
    setFormData(prevData => ({
      ...prevData,
      medicalDocument : file
    }));

  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLeaveError(''); // Reset error messages
    setErrors(false); // Reset error state
  
    // Validation: Check for medical document if leave type is "SICK" and duration > 2
    if (formData.leaveType === 'SICK' && formData.duration > 2 && !formData.medicalDocument) {
      setLeaveError("Please upload a document");
      return;
    }
  
    // Validation: Check for valid email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|middlewaretalents\.com)$/;
    if (!emailPattern.test(formData.email)) {
      setLeaveError('Please enter a valid email address from @gmail.com or @middlewaretalents.com');
      setErrors(true);
      return;
    }
  
    // Validation: Check if all required fields are filled
    const requiredFields = [
      'firstName', 'lastName', 'employeeId', 'email', 'managerId', 
      'managerName', 'managerEmail', 'position', 'leaveStartDate', 
      'leaveEndDate', 'leaveType', 'duration',
    ];
  
    const hasEmptyFields = requiredFields.some(field => !formData[field]);
    if (hasEmptyFields) {
      setLeaveError('Please fill in all required fields.');
      setErrors(true);
      return;
    }
  
    // Prepare FormData for submission
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (selectedFile) {
      data.append("medicalDocument", selectedFile); // Attach medical document if provided
    }
  
    setLoading(true); // Indicate loading state
  
    try {
      const url = isEditing
        ? `http://localhost:8080/leave/update/${formData.id}`
        : `http://localhost:8080/leave/submit`;
       let response;
        if(!isEditing){
          console.log(formData);
          response = await axios({
            method:  'POST',
            url,
            data : formData,
            headers : {
              'Content-Type' :  'multipart/form-data',
            },
            
          });
    
        }
        else{
          
          response = await axios({
            method:  'PUT',
            url,
            data : formData,
            /*headers : {
              'Content-Type' :  'multipart/form-data',
            },
            */
            
            
          });
    
        }
  
      // Handle success
      if (response.status === 200) {
        navigate('/employee');
      } else {
        setLeaveError('Error processing the request. Please try again.');
      }
    } catch (error) {
      // Handle errors
      console.log(error)
     
      setLeaveError(error.response.data || 'Error occurred');
      setErrors(true);
      console.log(leaveError);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

   // Handle date change
   const handleDateChange = (date, type) => {
    if (type === 'start') {
      setFormData((prevData) => ({
        ...prevData,
        leaveStartDate: date 
      }));
      setIsCalendarVisibleStart(false); // Hide calendar after date selection
    } else {
      setFormData((prevData) => ({
        ...prevData,
        leaveEndDate: date 
      }));
      setIsCalendarVisibleEnd(false); // Hide calendar after date selection
    }
  
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalDays = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // Exclude weekends (0 is Sunday, 6 is Saturday)
        totalDays++;
      }
    }

    return totalDays;
  };
   // Update duration when both dates are set
   useEffect(() => {
    if (formData.leaveStartDate && formData.leaveEndDate) {
      const duration = calculateDuration(formData.leaveStartDate, formData.leaveEndDate);
      setFormData((prevData) => ({
        ...prevData,
        duration
      }));
    }
  }, [formData.leaveStartDate, formData.leaveEndDate]);
  // Toggle calendar visibility
  const toggleCalendarVisibility = (type) => {
    if (type === 'start') {
      setIsCalendarVisibleStart(true);
      setIsCalendarVisibleEnd(false); // Close the end calendar when the start calendar opens
    } else if (type === 'end') {
      setIsCalendarVisibleEnd(true);
      setIsCalendarVisibleStart(false); // Close the start calendar when the end calendar opens
    }
  };

  // Get the current date for the minDate
  const currentDate = new Date();
 


  return (
    <div className={'mt-0 mb-0 bg-gray-100 text-gray-800'}>
      <h1 className="text-2xl font-semibold text-center font-Playfair-Display">
        {isEditing ? 'EDIT LEAVE REQUEST' : 'NEW LEAVE REQUEST'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 rounded-lg shadow-lg space-y-4 mt-10">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="firstName" className="mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              className={'p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm'}
              onChange={handleChange}
              value={formData.firstName}
            />
            {errors && formData.firstName === '' && <span className="text-red-600 text-sm">First Name is required</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="lastName" className="mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              className={'p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm'}
              onChange={handleChange}
              value={formData.lastName}
            />
            {errors && formData.lastName === '' && <span className="text-red-600 text-sm">Last Name is required</span>}
          </div>
        </div>

        {/* Employee ID */}
        <div className="flex flex-col">
          <label htmlFor="employeeId" className="mb-1">Employee ID</label>
          <input
            type="text"
            name="employeeId"
            className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
            onChange={handleChange}
            value={formData.employeeId}
          />
          {errors && formData.employeeId === '' && <span className="text-red-600 text-sm">Employee ID is required</span>}
        </div>

        {/* Email and Position */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1">Email</label>
            <input
              type="email"
              name="email"
              className={'p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm'}
              onChange={handleChange}
              value={formData.email}
            />
            {errors && formData.email === '' && <span className="text-red-600 text-sm">Email is required</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="position" className="mb-1">Position</label>
            <input
              type="text"
              name="position"
              className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
              onChange={handleChange}
              value={formData.position}
            />
            {errors && formData.position === '' && <span className="text-red-600 text-sm">Position is required</span>}
          </div>
        </div>

        {/* Manager Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="managerId" className="mb-1">Manager ID</label>
            <select
              type="text"
              name="managerId"
              className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
              onChange={handleChange}
              value={formData.managerId}>
               <option value="">Select Manager ID</option>
               <option value="MTL1006">MTL1006</option>
               <option value="MTL1008">MTL1008</option>
               <option value="MTL1009">MTL1009</option>
              </select>
            {errors && formData.managerId === '' && <span className="text-red-600 text-sm">Manager ID is required</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="managerEmail" className="mb-1">Manager Email</label>
            <select
              type="email"
              name="managerEmail"
              className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
              onChange={handleChange}
              value={formData.managerEmail}
              >
              <option value="">Select Manager Email</option>
              <option value="vani@gmail.com">vani@gmail.com</option>
              <option value="yamuna@gmail.com">yamuna@gmail.com</option>
              <option value="sowdhamini@gmail.com">sowdhamini@gmail.com</option>
              <option value="swapnadamala4@gmail.com">swapnadamala4@gmail.com</option>
              </select>
            
          </div>
        </div>

       {/* Leave Dates */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Date */}
       <div className="flex flex-col calendar-wrapper-start">
          <label htmlFor="leaveStartDate" className="mb-1">Start Date</label>
          <div className="relative">
            <input
              type="text"
              name="leaveStartDate"
              className="p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm"
              value={formData.leaveStartDate ? formData.leaveStartDate.toLocaleDateString() : ''}
              onClick={() => toggleCalendarVisibility('start')}
              
              readOnly
            />
            {isCalendarVisibleStart && (
              <div className="absolute top-[-300px] left-0 z-10">
                <Calendar
                  onChange={(date) => handleDateChange(date, 'start')}
                  value={formData.leaveStartDate ? new Date(formData.leaveStartDate) : null}
                  minDate={currentDate}  // Disable previous dates
                  style={{
                    width: '150px',   // Adjust the width of the calendar
                    fontSize: '0.9rem', // Adjust the font size inside the calendar
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* End Date */}
        <div className="flex flex-col calendar-wrapper-end">
          <label htmlFor="leaveEndDate" className="mb-1">End Date</label>
          <div className="relative">
            <input
              type="text"
              name="leaveEndDate"
              className="p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm"
              value={formData.leaveEndDate ? formData.leaveEndDate.toLocaleDateString() : ''}
              onClick={() => toggleCalendarVisibility('end')}
              readOnly
            />
            {isCalendarVisibleEnd && (
              <div className="absolute top-[-300px] left-0 z-10">
                <Calendar
                  onChange={(date) => handleDateChange(date, 'end')}
                  value={formData.leaveEndDate ? new Date(formData.leaveEndDate) : null}
                  minDate={currentDate}  // Disable previous dates
                  // Add style here to adjust the calendar size
                  style={{
                    width: '250px',    // Adjust the width of the calendar
                    fontSize: '0.9rem', // Adjust the font size inside the calendar
                  }}
                />
              </div>
            )}
          </div>
          </div>
          </div>

        {/* Duration */}
        <div className="flex flex-col">
          <label htmlFor="duration" className="mb-1">Duration (Days)</label>
          <input
            type="text"
            name="duration"
            className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
            value={formData.duration}
            readOnly
          />
          {errors && formData.duration === '' && <span className="text-red-600 text-sm">Duration is required</span>}
        </div>

        {/* Leave Type */}
        <div className="flex flex-col">
          <label htmlFor="leaveType" className="mb-1">Leave Type</label>
          <div className='flex items-center space-x-2'>
          <select
            name="leaveType"
            className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
            onChange={handleChange}
            value={formData.leaveType}
          >
            <option value="">Select Leave Type</option>
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="VACATION">Vacation Leave</option>
            <option value="MARRIAGE">Marriage Leave</option>
            <option value="MATERNITY">Maternity Leave</option>
            <option value="PATERNITY">Paternity Leave</option>
            <option value="OTHERS">Others</option>
          </select>
         
          </div>
          {errors && formData.leaveType === '' && <span className="text-red-600 text-sm">Leave Type is required</span>}
        </div>

        {formData.leaveType === 'SICK' && formData.duration > 2 && (
          <div className="flex flex-col">
            <label htmlFor="document" className="mb-1">Upload Document</label>
            <input
              type="file"
              name="document"
              onChange={handleFileChange}
              //value={formData.medicalDocument}
              className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
            />
          </div>
        )}

        {/* Comments for "OTHERS" Leave Type */}
        {isCommentsEnabled && (
          <div className="flex flex-col">
            <label htmlFor="comments" className="mb-1">Comments</label>
            <textarea
              name="comments"
              rows="4"
              className={`p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
              onChange={handleChange}
              value={formData.comments}
            ></textarea>
          </div>
        )}

        {leaveError && <span className="text-red-600 text-sm">{leaveError}</span>}

        <button
          type="submit"
          className={`w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:ring-2 focus:ring-blue-700 focus:outline-none text-sm`}
          disabled={loading}
        >
          {loading ? 'Submitting...' : isEditing ? 'Update Leave' : 'Submit Leave'}
        </button>
      </form>
    </div>
  );
}

export default LeaveRequestForm;
  