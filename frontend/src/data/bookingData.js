


const bookingData = {
  Building1: {
    Ground: createFloor(),
    First: createFloor(),
    Second: createFloor(),
  },
  Building2: {
    Ground: createFloor(),
    First: createFloor(),
    Second: createFloor(),
  }
};

function createFloor() {
  const rooms = {};

  for (let i = 1; i <= 18; i++) {
    rooms[`Room-${i}`] = {
      totalVacancies: 20,
      occupied: 0,          
      status: "AVAILABLE"   
    };
  }

  return rooms;
}

export default bookingData;
