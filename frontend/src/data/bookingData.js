


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
    const beds = [];
    for (let j = 1; j <= 20; j++) {
      beds.push({
        bedNumber: j,
        status: "AVAILABLE", // AVAILABLE or BOOKED
        occupiedBy: null,
        allocatedAt: null
      });
    }
    
    rooms[`Room-${i}`] = {
      totalVacancies: 20,
      occupied: 0,
      beds: beds,
      status: "AVAILABLE"
    };
  }

  return rooms;
}

export default bookingData;
